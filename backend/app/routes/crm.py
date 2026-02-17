from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.crm import (
    Campaign, CampaignEmail, Segment, SegmentMember,
    LoyaltyProgram, LoyaltyMember, LoyaltyTransaction, LoyaltyReward
)
from app.models.crm import CampaignStatus, CampaignType
from app.models.customer import Customer
from app.models.lead import Lead
from datetime import datetime, date
import uuid

crm_bp = Blueprint('crm', __name__)

def generate_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

# ============== CAMPAIGNS ==============

@crm_bp.route('/campaigns', methods=['GET'])
@jwt_required()
def get_campaigns():
    business_id = get_jwt_identity()
    branch_id = request.args.get('branch_id', type=int)
    campaign_type = request.args.get('type')
    status = request.args.get('status')
    
    query = Campaign.query.filter_by(business_id=business_id)
    
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    if campaign_type:
        query = query.filter_by(campaign_type=CampaignType[campaign_type.upper()])
    if status:
        query = query.filter_by(status=CampaignStatus[status.upper()])
    
    campaigns = query.order_by(Campaign.created_at.desc()).all()
    return jsonify([c.to_dict() for c in campaigns])

@crm_bp.route('/campaigns/<int:campaign_id>', methods=['GET'])
@jwt_required()
def get_campaign(campaign_id):
    business_id = get_jwt_identity()
    campaign = Campaign.query.filter_by(id=campaign_id, business_id=business_id).first()
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    return jsonify(campaign.to_dict())

@crm_bp.route('/campaigns', methods=['POST'])
@jwt_required()
def create_campaign():
    business_id = get_jwt_identity()
    user_id = get_jwt_identity()
    data = request.get_json()
    
    campaign = Campaign(
        business_id=business_id,
        branch_id=data.get('branch_id'),
        campaign_id=generate_id('CMP'),
        name=data['name'],
        description=data.get('description'),
        campaign_type=CampaignType[data['campaign_type'].upper()],
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None,
        end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None,
        schedule_time=datetime.strptime(data['schedule_time'], '%H:%M').time() if data.get('schedule_time') else None,
        subject=data.get('subject'),
        body=data.get('body'),
        template_id=data.get('template_id'),
        segment_id=data.get('segment_id'),
        budget=data.get('budget', 0),
        created_by=user_id
    )
    
    db.session.add(campaign)
    db.session.commit()
    return jsonify(campaign.to_dict()), 201

@crm_bp.route('/campaigns/<int:campaign_id>', methods=['PUT'])
@jwt_required()
def update_campaign(campaign_id):
    business_id = get_jwt_identity()
    campaign = Campaign.query.filter_by(id=campaign_id, business_id=business_id).first()
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(campaign, key) and key not in ['id', 'business_id', 'campaign_id', 'created_by']:
            if key == 'campaign_type':
                setattr(campaign, key, CampaignType[value.upper()])
            elif key == 'status':
                setattr(campaign, key, CampaignStatus[value.upper()])
            elif key in ['start_date', 'end_date'] and value:
                setattr(campaign, key, datetime.strptime(value, '%Y-%m-%d').date())
            elif key == 'schedule_time' and value:
                setattr(campaign, key, datetime.strptime(value, '%H:%M').time())
            else:
                setattr(campaign, key, value)
    
    db.session.commit()
    return jsonify(campaign.to_dict())

@crm_bp.route('/campaigns/<int:campaign_id>', methods=['DELETE'])
@jwt_required()
def delete_campaign(campaign_id):
    business_id = get_jwt_identity()
    campaign = Campaign.query.filter_by(id=campaign_id, business_id=business_id).first()
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    db.session.delete(campaign)
    db.session.commit()
    return jsonify({'message': 'Campaign deleted'})

@crm_bp.route('/campaigns/<int:campaign_id>/send', methods=['POST'])
@jwt_required()
def send_campaign(campaign_id):
    business_id = get_jwt_identity()
    campaign = Campaign.query.filter_by(id=campaign_id, business_id=business_id).first()
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    campaign.status = CampaignStatus.ACTIVE
    db.session.commit()
    return jsonify(campaign.to_dict())

# ============== SEGMENTS ==============

@crm_bp.route('/segments', methods=['GET'])
@jwt_required()
def get_segments():
    business_id = get_jwt_identity()
    branch_id = request.args.get('branch_id', type=int)
    
    query = Segment.query.filter_by(business_id=business_id)
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    
    segments = query.filter_by(is_active=True).order_by(Segment.name).all()
    return jsonify([s.to_dict() for s in segments])

@crm_bp.route('/segments/<int:segment_id>', methods=['GET'])
@jwt_required()
def get_segment(segment_id):
    business_id = get_jwt_identity()
    segment = Segment.query.filter_by(id=segment_id, business_id=business_id).first()
    if not segment:
        return jsonify({'error': 'Segment not found'}), 404
    return jsonify(segment.to_dict())

@crm_bp.route('/segments', methods=['POST'])
@jwt_required()
def create_segment():
    business_id = get_jwt_identity()
    user_id = get_jwt_identity()
    data = request.get_json()
    
    segment = Segment(
        business_id=business_id,
        branch_id=data.get('branch_id'),
        segment_id=generate_id('SEG'),
        name=data['name'],
        description=data.get('description'),
        criteria=data.get('criteria'),
        criteria_logic=data.get('criteria_logic', 'AND'),
        is_static=data.get('is_static', False),
        created_by=user_id
    )
    
    db.session.add(segment)
    db.session.commit()
    return jsonify(segment.to_dict()), 201

@crm_bp.route('/segments/<int:segment_id>', methods=['PUT'])
@jwt_required()
def update_segment(segment_id):
    business_id = get_jwt_identity()
    segment = Segment.query.filter_by(id=segment_id, business_id=business_id).first()
    if not segment:
        return jsonify({'error': 'Segment not found'}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(segment, key) and key not in ['id', 'business_id', 'segment_id', 'created_by']:
            setattr(segment, key, value)
    
    db.session.commit()
    return jsonify(segment.to_dict())

@crm_bp.route('/segments/<int:segment_id>', methods=['DELETE'])
@jwt_required()
def delete_segment(segment_id):
    business_id = get_jwt_identity()
    segment = Segment.query.filter_by(id=segment_id, business_id=business_id).first()
    if not segment:
        return jsonify({'error': 'Segment not found'}), 404
    
    segment.is_active = False
    db.session.commit()
    return jsonify({'message': 'Segment deleted'})

@crm_bp.route('/segments/<int:segment_id>/members', methods=['GET'])
@jwt_required()
def get_segment_members(segment_id):
    business_id = get_jwt_identity()
    segment = Segment.query.filter_by(id=segment_id, business_id=business_id).first()
    if not segment:
        return jsonify({'error': 'Segment not found'}), 404
    
    members = SegmentMember.query.filter_by(segment_id=segment_id).all()
    return jsonify([{
        'id': m.id,
        'customer_id': m.customer_id,
        'customer': m.customer.to_dict() if m.customer else None,
        'lead_id': m.lead_id,
        'lead': m.lead.to_dict() if m.lead else None,
        'added_at': m.added_at.isoformat() if m.added_at else None
    } for m in members])

@crm_bp.route('/segments/<int:segment_id>/members', methods=['POST'])
@jwt_required()
def add_segment_member(segment_id):
    business_id = get_jwt_identity()
    segment = Segment.query.filter_by(id=segment_id, business_id=business_id).first()
    if not segment:
        return jsonify({'error': 'Segment not found'}), 404
    
    data = request.get_json()
    
    member = SegmentMember(
        segment_id=segment_id,
        customer_id=data.get('customer_id'),
        lead_id=data.get('lead_id')
    )
    
    db.session.add(member)
    
    # Update counts
    if data.get('customer_id'):
        segment.customer_count = SegmentMember.query.filter_by(segment_id=segment_id, customer_id=data['customer_id']).count() + 1
    if data.get('lead_id'):
        segment.lead_count = SegmentMember.query.filter_by(segment_id=segment_id, lead_id=data['lead_id']).count() + 1
    
    db.session.commit()
    return jsonify({'message': 'Member added'}), 201

# ============== LOYALTY PROGRAMS ==============

@crm_bp.route('/loyalty/programs', methods=['GET'])
@jwt_required()
def get_loyalty_programs():
    business_id = get_jwt_identity()
    branch_id = request.args.get('branch_id', type=int)
    
    query = LoyaltyProgram.query.filter_by(business_id=business_id)
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    
    programs = query.filter_by(is_active=True).all()
    return jsonify([p.to_dict() for p in programs])

@crm_bp.route('/loyalty/programs/<int:program_id>', methods=['GET'])
@jwt_required()
def get_loyalty_program(program_id):
    business_id = get_jwt_identity()
    program = LoyaltyProgram.query.filter_by(id=program_id, business_id=business_id).first()
    if not program:
        return jsonify({'error': 'Program not found'}), 404
    return jsonify(program.to_dict())

@crm_bp.route('/loyalty/programs', methods=['POST'])
@jwt_required()
def create_loyalty_program():
    business_id = get_jwt_identity()
    data = request.get_json()
    
    program = LoyaltyProgram(
        business_id=business_id,
        branch_id=data.get('branch_id'),
        program_id=generate_id('LP'),
        name=data['name'],
        description=data.get('description'),
        points_per_currency=data.get('points_per_currency', 1.0),
        currency_per_point=data.get('currency_per_point', 0.01),
        has_tiers=data.get('has_tiers', False),
        tiers=data.get('tiers'),
        points_expire_days=data.get('points_expire_days')
    )
    
    db.session.add(program)
    db.session.commit()
    return jsonify(program.to_dict()), 201

@crm_bp.route('/loyalty/programs/<int:program_id>', methods=['PUT'])
@jwt_required()
def update_loyalty_program(program_id):
    business_id = get_jwt_identity()
    program = LoyaltyProgram.query.filter_by(id=program_id, business_id=business_id).first()
    if not program:
        return jsonify({'error': 'Program not found'}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(program, key) and key not in ['id', 'business_id', 'program_id']:
            setattr(program, key, value)
    
    db.session.commit()
    return jsonify(program.to_dict())

# ============== LOYALTY MEMBERS ==============

@crm_bp.route('/loyalty/members', methods=['GET'])
@jwt_required()
def get_loyalty_members():
    business_id = get_jwt_identity()
    program_id = request.args.get('program_id', type=int)
    
    query = LoyaltyMember.query.join(LoyaltyProgram).filter(LoyaltyProgram.business_id == business_id)
    if program_id:
        query = query.filter_by(program_id=program_id)
    
    members = query.order_by(LoyaltyMember.points_balance.desc()).all()
    return jsonify([m.to_dict() for m in members])

@crm_bp.route('/loyalty/members/<int:member_id>', methods=['GET'])
@jwt_required()
def get_loyalty_member(member_id):
    business_id = get_jwt_identity()
    member = LoyaltyMember.query.join(LoyaltyProgram).filter(
        LoyaltyMember.id == member_id,
        LoyaltyProgram.business_id == business_id
    ).first()
    if not member:
        return jsonify({'error': 'Member not found'}), 404
    return jsonify(member.to_dict())

@crm_bp.route('/loyalty/members', methods=['POST'])
@jwt_required()
def create_loyalty_member():
    business_id = get_jwt_identity()
    data = request.get_json()
    
    # Verify program exists
    program = LoyaltyProgram.query.filter_by(id=data['program_id'], business_id=business_id).first()
    if not program:
        return jsonify({'error': 'Program not found'}), 404
    
    member = LoyaltyMember(
        program_id=data['program_id'],
        customer_id=data['customer_id'],
        member_number=generate_id('LM')
    )
    
    db.session.add(member)
    db.session.commit()
    return jsonify(member.to_dict()), 201

@crm_bp.route('/loyalty/members/<int:member_id>/points', methods=['POST'])
@jwt_required()
def add_loyalty_points(member_id):
    business_id = get_jwt_identity()
    data = request.get_json()
    
    member = LoyaltyMember.query.join(LoyaltyProgram).filter(
        LoyaltyMember.id == member_id,
        LoyaltyProgram.business_id == business_id
    ).first()
    if not member:
        return jsonify({'error': 'Member not found'}), 404
    
    points = data.get('points', 0)
    transaction_type = data.get('type', 'earn')  # earn, redeem
    
    if transaction_type == 'earn':
        member.points_balance += points
        member.points_earned += points
    elif transaction_type == 'redeem':
        if member.points_balance < points:
            return jsonify({'error': 'Insufficient points'}), 400
        member.points_balance -= points
        member.points_redeemed += points
    
    # Create transaction record
    transaction = LoyaltyTransaction(
        member_id=member_id,
        transaction_type=transaction_type,
        points=points,
        balance_after=member.points_balance,
        order_id=data.get('order_id'),
        invoice_id=data.get('invoice_id'),
        description=data.get('description')
    )
    
    db.session.add(transaction)
    member.last_activity_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(member.to_dict())

# ============== LOYALTY REWARDS ==============

@crm_bp.route('/loyalty/rewards', methods=['GET'])
@jwt_required()
def get_loyalty_rewards():
    business_id = get_jwt_identity()
    program_id = request.args.get('program_id', type=int)
    
    query = LoyaltyReward.query.join(LoyaltyProgram).filter(LoyaltyProgram.business_id == business_id)
    if program_id:
        query = query.filter_by(program_id=program_id)
    
    rewards = query.filter_by(is_active=True).all()
    return jsonify([r.to_dict() for r in rewards])

@crm_bp.route('/loyalty/rewards', methods=['POST'])
@jwt_required()
def create_loyalty_reward():
    business_id = get_jwt_identity()
    data = request.get_json()
    
    # Verify program exists
    program = LoyaltyProgram.query.filter_by(id=data['program_id'], business_id=business_id).first()
    if not program:
        return jsonify({'error': 'Program not found'}), 404
    
    reward = LoyaltyReward(
        program_id=data['program_id'],
        reward_id=generate_id('RWD'),
        name=data['name'],
        description=data.get('description'),
        reward_type=data['reward_type'],
        points_required=data['points_required'],
        discount_percent=data.get('discount_percent'),
        discount_amount=data.get('discount_amount'),
        free_product_id=data.get('free_product_id'),
        free_service_id=data.get('free_service_id'),
        voucher_code=data.get('voucher_code'),
        quantity_available=data.get('quantity_available'),
        valid_from=datetime.strptime(data['valid_from'], '%Y-%m-%d').date() if data.get('valid_from') else None,
        valid_until=datetime.strptime(data['valid_until'], '%Y-%m-%d').date() if data.get('valid_until') else None
    )
    
    db.session.add(reward)
    db.session.commit()
    return jsonify(reward.to_dict()), 201

@crm_bp.route('/loyalty/rewards/<int:reward_id>/claim', methods=['POST'])
@jwt_required()
def claim_loyalty_reward(reward_id):
    business_id = get_jwt_identity()
    data = request.get_json()
    
    reward = LoyaltyReward.query.join(LoyaltyProgram).filter(
        LoyaltyReward.id == reward_id,
        LoyaltyProgram.business_id == business_id
    ).first()
    if not reward:
        return jsonify({'error': 'Reward not found'}), 404
    
    member = LoyaltyMember.query.filter_by(id=data['member_id']).first()
    if not member:
        return jsonify({'error': 'Member not found'}), 404
    
    if member.points_balance < reward.points_required:
        return jsonify({'error': 'Insufficient points'}), 400
    
    # Deduct points
    member.points_balance -= reward.points_required
    member.points_redeemed += reward.points_required
    
    # Create transaction
    transaction = LoyaltyTransaction(
        member_id=member.id,
        transaction_type='redeem',
        points=-reward.points_required,
        balance_after=member.points_balance,
        reward_id=reward_id,
        description=f'Claimed reward: {reward.name}'
    )
    
    db.session.add(transaction)
    
    # Update reward quantity
    if reward.quantity_available:
        reward.quantity_claimed += 1
    
    member.last_activity_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Reward claimed successfully',
        'voucher_code': reward.voucher_code
    })
