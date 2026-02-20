from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from app import db, bcrypt
from app.models.api_integrations import (
    APIClient, APIAccessToken, WebhookSubscription, WebhookDelivery,
    Currency, ExchangeRate, CustomField, CustomFieldValue, DocumentTemplate
)
from app.models.api_integrations import APIClientType, WebhookEvent
from app.utils.notifications import trigger_webhook
from app.utils.middleware import get_business_id
from datetime import datetime, date, timedelta
import uuid
import secrets
import hashlib
import hmac
import requests

api_bp = Blueprint('api', __name__)

def generate_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

def generate_client_id():
    return uuid.uuid4().hex[:32]

def generate_client_secret():
    return secrets.token_hex(32)

# ============== API CLIENTS ==============

@api_bp.route('/clients', methods=['GET'])
@jwt_required()
def get_api_clients():
    business_id = get_business_id()
    clients = APIClient.query.filter_by(business_id=business_id).order_by(APIClient.created_at.desc()).all()
    return jsonify([c.to_dict() for c in clients])

@api_bp.route('/clients/<int:client_id>', methods=['GET'])
@jwt_required()
def get_api_client(client_id):
    business_id = get_business_id()
    client = APIClient.query.filter_by(id=client_id, business_id=business_id).first()
    if not client:
        return jsonify({'error': 'API client not found'}), 404
    return jsonify(client.to_dict(include_secret=True))

@api_bp.route('/clients', methods=['POST'])
@jwt_required()
def create_api_client():
    business_id = get_business_id()
    user_id = get_jwt_identity()
    data = request.get_json()
    
    client_secret = generate_client_secret()
    hashed_secret = bcrypt.generate_password_hash(client_secret).decode('utf-8')
    
    client = APIClient(
        business_id=business_id,
        client_id=generate_client_id(),
        client_name=data['client_name'],
        client_type=APIClientType[data.get('client_type', 'PRIVATE').upper()],
        client_secret=hashed_secret,
        scopes=data.get('scopes', ['read']),
        rate_limit_per_hour=data.get('rate_limit_per_hour', 1000),
        redirect_uris=data.get('redirect_uris'),
        allowed_ips=data.get('allowed_ips'),
        created_by=user_id
    )
    
    db.session.add(client)
    db.session.commit()
    
    # Return secret only once
    result = client.to_dict(include_secret=True)
    result['client_secret'] = client_secret
    return jsonify(result), 201

@api_bp.route('/clients/<int:client_id>', methods=['PUT'])
@jwt_required()
def update_api_client(client_id):
    business_id = get_business_id()
    client = APIClient.query.filter_by(id=client_id, business_id=business_id).first()
    if not client:
        return jsonify({'error': 'API client not found'}), 404
    
    data = request.get_json()
    for key in ['client_name', 'client_type', 'scopes', 'rate_limit_per_hour', 'redirect_uris', 'allowed_ips', 'is_active']:
        if key in data:
            if key == 'client_type':
                setattr(client, key, APIClientType[data[key].upper()])
            else:
                setattr(client, key, data[key])
    
    db.session.commit()
    return jsonify(client.to_dict())

@api_bp.route('/clients/<int:client_id>/regenerate-secret', methods=['POST'])
@jwt_required()
def regenerate_client_secret(client_id):
    business_id = get_business_id()
    client = APIClient.query.filter_by(id=client_id, business_id=business_id).first()
    if not client:
        return jsonify({'error': 'API client not found'}), 404
    
    new_secret = generate_client_secret()
    client.client_secret = bcrypt.generate_password_hash(new_secret).decode('utf-8')
    db.session.commit()
    
    result = client.to_dict()
    result['client_secret'] = new_secret
    return jsonify(result)

@api_bp.route('/clients/<int:client_id>', methods=['DELETE'])
@jwt_required()
def delete_api_client(client_id):
    business_id = get_business_id()
    client = APIClient.query.filter_by(id=client_id, business_id=business_id).first()
    if not client:
        return jsonify({'error': 'API client not found'}), 404
    
    client.is_active = False
    db.session.commit()
    return jsonify({'message': 'API client deactivated'})

# ============== ACCESS TOKENS ==============

@api_bp.route('/tokens', methods=['GET'])
@jwt_required()
def get_access_tokens():
    business_id = get_business_id()
    client_id = request.args.get('client_id', type=int)
    
    query = APIAccessToken.query.join(APIClient).filter(APIClient.business_id == business_id)
    if client_id:
        query = query.filter_by(client_id=client_id)
    
    tokens = query.filter_by(is_revoked=False).order_by(APIAccessToken.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tokens])

@api_bp.route('/tokens', methods=['POST'])
@jwt_required()
def create_access_token():
    business_id = get_business_id()
    data = request.get_json()
    
    client = APIClient.query.filter_by(id=data['client_id'], business_id=business_id).first()
    if not client:
        return jsonify({'error': 'API client not found'}), 404
    
    # Generate token
    token = secrets.token_urlsafe(32)
    
    access_token = APIAccessToken(
        client_id=client.id,
        user_id=data.get('user_id'),
        token=token,
        scopes=data.get('scopes', client.scopes),
        expires_at=datetime.utcnow() + timedelta(days=data.get('expires_in_days', 365))
    )
    
    db.session.add(access_token)
    db.session.commit()
    
    result = access_token.to_dict()
    result['access_token'] = token
    return jsonify(result), 201

@api_bp.route('/tokens/<int:token_id>/revoke', methods=['POST'])
@jwt_required()
def revoke_access_token(token_id):
    business_id = get_business_id()
    
    token = APIAccessToken.query.join(APIClient).filter(
        APIAccessToken.id == token_id,
        APIClient.business_id == business_id
    ).first()
    
    if not token:
        return jsonify({'error': 'Token not found'}), 404
    
    token.is_revoked = True
    db.session.commit()
    return jsonify({'message': 'Token revoked'})

# ============== WEBHOOKS ==============

@api_bp.route('/webhooks', methods=['GET'])
@jwt_required()
def get_webhooks():
    business_id = get_business_id()
    
    webhooks = WebhookSubscription.query.join(APIClient).filter(
        APIClient.business_id == business_id
    ).order_by(WebhookSubscription.created_at.desc()).all()
    
    return jsonify([w.to_dict() for w in webhooks])

@api_bp.route('/webhooks/<int:webhook_id>', methods=['GET'])
@jwt_required()
def get_webhook(webhook_id):
    business_id = get_business_id()
    
    webhook = WebhookSubscription.query.join(APIClient).filter(
        WebhookSubscription.id == webhook_id,
        APIClient.business_id == business_id
    ).first()
    
    if not webhook:
        return jsonify({'error': 'Webhook not found'}), 404
    
    return jsonify(webhook.to_dict(include_secret=True))

@api_bp.route('/webhooks', methods=['POST'])
@jwt_required()
def create_webhook():
    business_id = get_business_id()
    user_id = get_jwt_identity()
    data = request.get_json()
    
    client = APIClient.query.filter_by(id=data['client_id'], business_id=business_id).first()
    if not client:
        return jsonify({'error': 'API client not found'}), 404
    
    webhook_secret = secrets.token_hex(32)
    
    webhook = WebhookSubscription(
        client_id=client.id,
        subscription_id=generate_id('WH'),
        name=data['name'],
        events=data['events'],
        webhook_url=data['webhook_url'],
        webhook_secret=webhook_secret,
        retry_count=data.get('retry_count', 3),
        timeout_seconds=data.get('timeout_seconds', 30),
        filters=data.get('filters'),
        created_by=user_id
    )
    
    db.session.add(webhook)
    db.session.commit()
    
    result = webhook.to_dict(include_secret=True)
    return jsonify(result), 201

@api_bp.route('/webhooks/<int:webhook_id>', methods=['PUT'])
@jwt_required()
def update_webhook(webhook_id):
    business_id = get_business_id()
    
    webhook = WebhookSubscription.query.join(APIClient).filter(
        WebhookSubscription.id == webhook_id,
        APIClient.business_id == business_id
    ).first()
    
    if not webhook:
        return jsonify({'error': 'Webhook not found'}), 404
    
    data = request.get_json()
    for key in ['name', 'events', 'webhook_url', 'retry_count', 'timeout_seconds', 'filters', 'is_active']:
        if key in data:
            setattr(webhook, key, data[key])
    
    db.session.commit()
    return jsonify(webhook.to_dict())

@api_bp.route('/webhooks/<int:webhook_id>', methods=['DELETE'])
@jwt_required()
def delete_webhook(webhook_id):
    business_id = get_business_id()
    
    webhook = WebhookSubscription.query.join(APIClient).filter(
        WebhookSubscription.id == webhook_id,
        APIClient.business_id == business_id
    ).first()
    
    if not webhook:
        return jsonify({'error': 'Webhook not found'}), 404
    
    webhook.is_active = False
    db.session.commit()
    return jsonify({'message': 'Webhook deactivated'})

@api_bp.route('/webhooks/<int:webhook_id>/deliveries', methods=['GET'])
@jwt_required()
def get_webhook_deliveries(webhook_id):
    business_id = get_business_id()
    
    webhook = WebhookSubscription.query.join(APIClient).filter(
        WebhookSubscription.id == webhook_id,
        APIClient.business_id == business_id
    ).first()
    
    if not webhook:
        return jsonify({'error': 'Webhook not found'}), 404
    
    deliveries = WebhookDelivery.query.filter_by(subscription_id=webhook_id).order_by(
        WebhookDelivery.created_at.desc()
    ).limit(50).all()
    
    return jsonify([d.to_dict() for d in deliveries])

@api_bp.route('/webhooks/<int:webhook_id>/test', methods=['POST'])
@jwt_required()
def test_webhook(webhook_id):
    business_id = get_business_id()
    
    webhook = WebhookSubscription.query.join(APIClient).filter(
        WebhookSubscription.id == webhook_id,
        APIClient.business_id == business_id
    ).first()
    
    if not webhook:
        return jsonify({'error': 'Webhook not found'}), 404
    
    # Trigger a test delivery
    data = request.get_json() or {}
    payload = data.get('payload', {'event': 'test', 'message': 'Test webhook'})
    
    result = trigger_webhook(webhook, payload)
    
    return jsonify(result)

# ============== CURRENCIES ==============

@api_bp.route('/currencies', methods=['GET'])
@jwt_required()
def get_currencies():
    currencies = Currency.query.filter_by(is_active=True).order_by(Currency.code).all()
    return jsonify([c.to_dict() for c in currencies])

@api_bp.route('/currencies/<string:code>', methods=['GET'])
@jwt_required()
def get_currency(code):
    currency = Currency.query.filter_by(code=code.upper()).first()
    if not currency:
        return jsonify({'error': 'Currency not found'}), 404
    return jsonify(currency.to_dict())

@api_bp.route('/currencies', methods=['POST'])
@jwt_required()
def create_currency():
    data = request.get_json()
    
    currency = Currency(
        code=data['code'].upper(),
        name=data['name'],
        symbol=data['symbol'],
        exchange_rate=data.get('exchange_rate', 1.0),
        is_base=data.get('is_base', False),
        decimal_places=data.get('decimal_places', 2),
        decimal_separator=data.get('decimal_separator', '.'),
        thousands_separator=data.get('thousands_separator', ',')
    )
    
    db.session.add(currency)
    db.session.commit()
    return jsonify(currency.to_dict()), 201

@api_bp.route('/exchange-rates', methods=['GET'])
@jwt_required()
def get_exchange_rates():
    from_currency = request.args.get('from', 'USD')
    to_currency = request.args.get('to')
    
    if to_currency:
        rates = ExchangeRate.query.filter_by(from_currency=from_currency.upper(), to_currency=to_currency.upper()).order_by(
            ExchangeRate.effective_date.desc()
        ).limit(30).all()
    else:
        rates = ExchangeRate.query.filter_by(from_currency=from_currency.upper()).order_by(
            ExchangeRate.effective_date.desc()
        ).limit(30).all()
    
    return jsonify([r.to_dict() for r in rates])

@api_bp.route('/exchange-rates', methods=['POST'])
@jwt_required()
def create_exchange_rate():
    data = request.get_json()
    
    rate = ExchangeRate(
        from_currency=data['from_currency'].upper(),
        to_currency=data['to_currency'].upper(),
        rate=data['rate'],
        effective_date=datetime.strptime(data['effective_date'], '%Y-%m-%d').date() if data.get('effective_date') else date.today()
    )
    
    db.session.add(rate)
    db.session.commit()
    return jsonify(rate.to_dict()), 201

# ============== CUSTOM FIELDS ==============

@api_bp.route('/custom-fields', methods=['GET'])
@jwt_required()
def get_custom_fields():
    business_id = get_business_id()
    entity_type = request.args.get('entity_type')
    
    query = CustomField.query.filter_by(business_id=business_id, is_active=True)
    if entity_type:
        query = query.filter_by(entity_type=entity_type)
    
    fields = query.order_by(CustomField.display_order).all()
    return jsonify([f.to_dict() for f in fields])

@api_bp.route('/custom-fields/<int:field_id>', methods=['GET'])
@jwt_required()
def get_custom_field(field_id):
    business_id = get_business_id()
    field = CustomField.query.filter_by(id=field_id, business_id=business_id).first()
    if not field:
        return jsonify({'error': 'Custom field not found'}), 404
    return jsonify(field.to_dict())

@api_bp.route('/custom-fields', methods=['POST'])
@jwt_required()
def create_custom_field():
    business_id = get_business_id()
    user_id = get_jwt_identity()
    data = request.get_json()
    
    field = CustomField(
        business_id=business_id,
        field_id=data['field_id'],
        name=data['name'],
        description=data.get('description'),
        field_type=data['field_type'],
        options=data.get('options'),
        is_required=data.get('is_required', False),
        default_value=data.get('default_value'),
        min_value=data.get('min_value'),
        max_value=data.get('max_value'),
        pattern=data.get('pattern'),
        entity_type=data['entity_type'],
        display_order=data.get('display_order', 0),
        is_visible=data.get('is_visible', True),
        is_searchable=data.get('is_searchable', False),
        created_by=user_id
    )
    
    db.session.add(field)
    db.session.commit()
    return jsonify(field.to_dict()), 201

@api_bp.route('/custom-fields/<int:field_id>', methods=['PUT'])
@jwt_required()
def update_custom_field(field_id):
    business_id = get_business_id()
    field = CustomField.query.filter_by(id=field_id, business_id=business_id).first()
    if not field:
        return jsonify({'error': 'Custom field not found'}), 404
    
    data = request.get_json()
    for key in ['name', 'description', 'options', 'is_required', 'default_value', 
                'min_value', 'max_value', 'pattern', 'display_order', 'is_visible', 'is_searchable', 'is_active']:
        if key in data:
            setattr(field, key, data[key])
    
    db.session.commit()
    return jsonify(field.to_dict())

@api_bp.route('/custom-fields/<int:field_id>', methods=['DELETE'])
@jwt_required()
def delete_custom_field(field_id):
    business_id = get_business_id()
    field = CustomField.query.filter_by(id=field_id, business_id=business_id).first()
    if not field:
        return jsonify({'error': 'Custom field not found'}), 404
    
    # Delete all values
    CustomFieldValue.query.filter_by(field_id=field_id).delete()
    db.session.delete(field)
    db.session.commit()
    return jsonify({'message': 'Custom field deleted'})

@api_bp.route('/custom-fields/values', methods=['GET'])
@jwt_required()
def get_custom_field_values():
    business_id = get_business_id()
    entity_type = request.args.get('entity_type')
    entity_id = request.args.get('entity_id', type=int)
    
    if not entity_type or not entity_id:
        return jsonify({'error': 'entity_type and entity_id required'}), 400
    
    # Get field IDs for this business and entity type
    field_ids = db.session.query(CustomField.id).filter_by(business_id=business_id, entity_type=entity_type, is_active=True).all()
    field_ids = [f[0] for f in field_ids]
    
    values = CustomFieldValue.query.filter(
        CustomFieldValue.field_id.in_(field_ids),
        CustomFieldValue.entity_type == entity_type,
        CustomFieldValue.entity_id == entity_id
    ).all()
    
    return jsonify([v.to_dict() for v in values])

@api_bp.route('/custom-fields/values', methods=['POST'])
@jwt_required()
def set_custom_field_value():
    business_id = get_business_id()
    data = request.get_json()
    
    # Verify field exists and belongs to business
    field = CustomField.query.filter_by(id=data['field_id'], business_id=business_id).first()
    if not field:
        return jsonify({'error': 'Custom field not found'}), 404
    
    # Find existing value
    value = CustomFieldValue.query.filter_by(
        field_id=data['field_id'],
        entity_type=data['entity_type'],
        entity_id=data['entity_id']
    ).first()
    
    if value:
        value.value = str(data['value'])
    else:
        value = CustomFieldValue(
            field_id=data['field_id'],
            entity_type=data['entity_type'],
            entity_id=data['entity_id'],
            value=str(data['value'])
        )
        db.session.add(value)
    
    db.session.commit()
    return jsonify(value.to_dict())

# ============== DOCUMENT TEMPLATES ==============

@api_bp.route('/document-templates', methods=['GET'])
@jwt_required()
def get_document_templates():
    business_id = get_business_id()
    branch_id = request.args.get('branch_id', type=int)
    template_type = request.args.get('type')
    
    query = DocumentTemplate.query.filter_by(business_id=business_id, is_active=True)
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    if template_type:
        query = query.filter_by(template_type=template_type)
    
    templates = query.order_by(DocumentTemplate.name).all()
    return jsonify([t.to_dict() for t in templates])

@api_bp.route('/document-templates/<int:template_id>', methods=['GET'])
@jwt_required()
def get_document_template(template_id):
    business_id = get_business_id()
    template = DocumentTemplate.query.filter_by(id=template_id, business_id=business_id).first()
    if not template:
        return jsonify({'error': 'Document template not found'}), 404
    return jsonify(template.to_dict())

@api_bp.route('/document-templates', methods=['POST'])
@jwt_required()
def create_document_template():
    business_id = get_business_id()
    user_id = get_jwt_identity()
    data = request.get_json()
    
    template = DocumentTemplate(
        business_id=business_id,
        branch_id=data.get('branch_id'),
        template_id=data['template_id'],
        name=data['name'],
        description=data.get('description'),
        template_type=data['template_type'],
        content=data['content'],
        template_format=data.get('template_format', 'html'),
        is_default=data.get('is_default', False),
        header_color=data.get('header_color'),
        logo_url=data.get('logo_url'),
        created_by=user_id
    )
    
    # If setting as default, unset other defaults
    if template.is_default:
        DocumentTemplate.query.filter_by(
            business_id=business_id,
            template_type=template.template_type
        ).update({'is_default': False})
    
    db.session.add(template)
    db.session.commit()
    return jsonify(template.to_dict()), 201

@api_bp.route('/document-templates/<int:template_id>', methods=['PUT'])
@jwt_required()
def update_document_template(template_id):
    business_id = get_business_id()
    template = DocumentTemplate.query.filter_by(id=template_id, business_id=business_id).first()
    if not template:
        return jsonify({'error': 'Document template not found'}), 404
    
    data = request.get_json()
    
    # If setting as default, unset other defaults
    if data.get('is_default') and not template.is_default:
        DocumentTemplate.query.filter_by(
            business_id=business_id,
            template_type=template.template_type
        ).update({'is_default': False})
    
    for key in ['name', 'description', 'content', 'template_format', 'is_default', 'header_color', 'logo_url', 'is_active']:
        if key in data:
            setattr(template, key, data[key])
    
    db.session.commit()
    return jsonify(template.to_dict())

@api_bp.route('/document-templates/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_document_template(template_id):
    business_id = get_business_id()
    template = DocumentTemplate.query.filter_by(id=template_id, business_id=business_id).first()
    if not template:
        return jsonify({'error': 'Document template not found'}), 404
    
    template.is_active = False
    db.session.commit()
    return jsonify({'message': 'Document template deleted'})
