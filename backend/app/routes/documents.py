from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.document import Document
from app.models.user import User
from werkzeug.utils import secure_filename
import os, uuid

ALLOWED_EXT = None  # Allow all by default; could restrict by mimetype or extension

documents_bp = Blueprint('documents', __name__)

@documents_bp.route('/', methods=['GET'])
@jwt_required()
def list_documents():
    try:
        claims = get_jwt()
        business_id = claims.get('business_id')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')

        query = Document.query.filter_by(business_id=business_id)
        if search:
            query = query.filter(Document.filename.ilike(f"%{search}%"))

        pagination = query.order_by(Document.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
        docs = [d.to_dict() for d in pagination.items]
        return jsonify({'documents': docs, 'total': pagination.total, 'page': page, 'per_page': per_page}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@documents_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

        upload_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'uploads', 'documents')
        os.makedirs(upload_dir, exist_ok=True)
        new_filename = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
        file_path = os.path.join(upload_dir, new_filename)
        file.save(file_path)

        # Create Document record
        claims = get_jwt()
        business_id = claims.get('business_id')
        current_user_id = int(get_jwt_identity())

        doc = Document(
            business_id=business_id,
            filename=filename,
            path=f'uploads/documents/{new_filename}',
            mimetype=file.mimetype,
            size=os.path.getsize(file_path),
            uploaded_by=current_user_id
        )
        db.session.add(doc)
        db.session.commit()

        return jsonify({'document': doc.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@documents_bp.route('/<int:doc_id>/download', methods=['GET'])
@jwt_required()
def download_document(doc_id):
    try:
        claims = get_jwt()
        business_id = claims.get('business_id')
        doc = Document.query.get(doc_id)
        if not doc or doc.business_id != business_id:
            return jsonify({'error': 'Document not found'}), 404

        # Increment download count
        doc.download_count = (doc.download_count or 0) + 1
        db.session.commit()

        # Serve file
        uploads_root = os.path.join(os.path.dirname(__file__), '..', 'static', 'uploads', 'documents')
        filename = os.path.basename(doc.path)
        return send_from_directory(uploads_root, filename, as_attachment=True, attachment_filename=doc.filename)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@documents_bp.route('/<int:doc_id>/view', methods=['POST'])
@jwt_required()
def view_document(doc_id):
    try:
        claims = get_jwt()
        business_id = claims.get('business_id')
        doc = Document.query.get(doc_id)
        if not doc or doc.business_id != business_id:
            return jsonify({'error': 'Document not found'}), 404

        # Increment view count
        doc.view_count = (doc.view_count or 0) + 1
        db.session.commit()

        return jsonify({'message': 'View count updated', 'view_count': doc.view_count}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@documents_bp.route('/<int:doc_id>', methods=['DELETE'])
@jwt_required()
def delete_document(doc_id):
    try:
        claims = get_jwt()
        business_id = claims.get('business_id')
        doc = Document.query.get(doc_id)
        if not doc or doc.business_id != business_id:
            return jsonify({'error': 'Document not found'}), 404

        # Delete file from disk
        uploads_root = os.path.join(os.path.dirname(__file__), '..', 'static', 'uploads', 'documents')
        filename = os.path.basename(doc.path)
        file_path = os.path.join(uploads_root, filename)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass

        db.session.delete(doc)
        db.session.commit()
        return jsonify({'message': 'Document deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500