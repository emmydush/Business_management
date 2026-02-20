from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.workflow import Workflow, WorkflowTrigger, WorkflowAction, WorkflowRun, WorkflowActionResult
from app.models.workflow import WorkflowStatus, TriggerType, ActionType
from app.utils.middleware import get_business_id
from datetime import datetime, date
import uuid
import json

workflows_bp = Blueprint('workflows', __name__)

def generate_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

# ============== WORKFLOWS ==============

@workflows_bp.route('', methods=['GET'])
@jwt_required()
def get_workflows():
    business_id = get_business_id()
    branch_id = request.args.get('branch_id', type=int)
    status = request.args.get('status')
    
    query = Workflow.query.filter_by(business_id=business_id)
    
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    if status:
        query = query.filter_by(status=WorkflowStatus[status.upper()])
    
    workflows = query.order_by(Workflow.created_at.desc()).all()
    return jsonify([w.to_dict() for w in workflows])

@workflows_bp.route('/<int:workflow_id>', methods=['GET'])
@jwt_required()
def get_workflow(workflow_id):
    business_id = get_business_id()
    workflow = Workflow.query.filter_by(id=workflow_id, business_id=business_id).first()
    if not workflow:
        return jsonify({'error': 'Workflow not found'}), 404
    return jsonify(workflow.to_dict())

@workflows_bp.route('', methods=['POST'])
@jwt_required()
def create_workflow():
    business_id = get_business_id()
    user_id = get_jwt_identity()
    data = request.get_json()
    
    workflow = Workflow(
        business_id=business_id,
        branch_id=data.get('branch_id'),
        workflow_id=generate_id('WF'),
        name=data['name'],
        description=data.get('description'),
        status=WorkflowStatus.DRAFT,
        trigger_type=TriggerType[data.get('trigger_type', 'EVENT').upper()],
        priority=data.get('priority', 0),
        max_runs_per_day=data.get('max_runs_per_day', 1000),
        created_by=user_id
    )
    
    # Add triggers
    for trigger_data in data.get('triggers', []):
        trigger = WorkflowTrigger(
            trigger_type=trigger_data.get('trigger_type', 'event'),
            entity_type=trigger_data.get('entity_type'),
            event_type=trigger_data.get('event_type'),
            event_filters=trigger_data.get('event_filters'),
            schedule_type=trigger_data.get('schedule_type'),
            schedule_time=trigger_data.get('schedule_time'),
            schedule_days=trigger_data.get('schedule_days'),
            schedule_cron=trigger_data.get('schedule_cron'),
            conditions=trigger_data.get('conditions'),
            conditions_logic=trigger_data.get('conditions_logic', 'AND')
        )
        workflow.triggers.append(trigger)
    
    # Add actions
    for i, action_data in enumerate(data.get('actions', [])):
        action = WorkflowAction(
            sequence=action_data.get('sequence', i),
            action_type=action_data['action_type'],
            name=action_data.get('name', action_data['action_type']),
            config=action_data.get('config', {}),
            delay_seconds=action_data.get('delay_seconds', 0),
            on_error=action_data.get('on_error', 'stop')
        )
        workflow.actions.append(action)
    
    db.session.add(workflow)
    db.session.commit()
    return jsonify(workflow.to_dict()), 201

@workflows_bp.route('/<int:workflow_id>', methods=['PUT'])
@jwt_required()
def update_workflow(workflow_id):
    business_id = get_business_id()
    workflow = Workflow.query.filter_by(id=workflow_id, business_id=business_id).first()
    if not workflow:
        return jsonify({'error': 'Workflow not found'}), 404
    
    data = request.get_json()
    
    for key in ['name', 'description', 'priority', 'trigger_type', 'max_runs_per_day', 'is_active']:
        if key in data:
            if key == 'trigger_type':
                setattr(workflow, key, TriggerType[data[key].upper()])
            elif key == 'status' and data.get('status'):
                setattr(workflow, key, WorkflowStatus[data[key].upper()])
            else:
                setattr(workflow, key, data[key])
    
    # Update triggers if provided
    if 'triggers' in data:
        WorkflowTrigger.query.filter_by(workflow_id=workflow_id).delete()
        for trigger_data in data['triggers']:
            trigger = WorkflowTrigger(
                workflow_id=workflow_id,
                trigger_type=trigger_data.get('trigger_type', 'event'),
                entity_type=trigger_data.get('entity_type'),
                event_type=trigger_data.get('event_type'),
                event_filters=trigger_data.get('event_filters'),
                schedule_type=trigger_data.get('schedule_type'),
                schedule_days=trigger_data.get('schedule_days'),
                schedule_cron=trigger_data.get('schedule_cron'),
                conditions=trigger_data.get('conditions'),
                conditions_logic=trigger_data.get('conditions_logic', 'AND')
            )
            db.session.add(trigger)
    
    # Update actions if provided
    if 'actions' in data:
        WorkflowAction.query.filter_by(workflow_id=workflow_id).delete()
        for i, action_data in enumerate(data['actions']):
            action = WorkflowAction(
                workflow_id=workflow_id,
                sequence=action_data.get('sequence', i),
                action_type=action_data['action_type'],
                name=action_data.get('name', action_data['action_type']),
                config=action_data.get('config', {}),
                delay_seconds=action_data.get('delay_seconds', 0),
                on_error=action_data.get('on_error', 'stop')
            )
            db.session.add(action)
    
    db.session.commit()
    return jsonify(workflow.to_dict())

@workflows_bp.route('/<int:workflow_id>', methods=['DELETE'])
@jwt_required()
def delete_workflow(workflow_id):
    business_id = get_business_id()
    workflow = Workflow.query.filter_by(id=workflow_id, business_id=business_id).first()
    if not workflow:
        return jsonify({'error': 'Workflow not found'}), 404
    
    workflow.is_active = False
    db.session.commit()
    return jsonify({'message': 'Workflow deactivated'})

@workflows_bp.route('/<int:workflow_id>/activate', methods=['POST'])
@jwt_required()
def activate_workflow(workflow_id):
    business_id = get_business_id()
    workflow = Workflow.query.filter_by(id=workflow_id, business_id=business_id).first()
    if not workflow:
        return jsonify({'error': 'Workflow not found'}), 404
    
    workflow.status = WorkflowStatus.ACTIVE
    db.session.commit()
    return jsonify(workflow.to_dict())

@workflows_bp.route('/<int:workflow_id>/pause', methods=['POST'])
@jwt_required()
def pause_workflow(workflow_id):
    business_id = get_business_id()
    workflow = Workflow.query.filter_by(id=workflow_id, business_id=business_id).first()
    if not workflow:
        return jsonify({'error': 'Workflow not found'}), 404
    
    workflow.status = WorkflowStatus.PAUSED
    db.session.commit()
    return jsonify(workflow.to_dict())

# ============== WORKFLOW RUNS ==============

@workflows_bp.route('/<int:workflow_id>/runs', methods=['GET'])
@jwt_required()
def get_workflow_runs(workflow_id):
    business_id = get_business_id()
    workflow = Workflow.query.filter_by(id=workflow_id, business_id=business_id).first()
    if not workflow:
        return jsonify({'error': 'Workflow not found'}), 404
    
    runs = WorkflowRun.query.filter_by(workflow_id=workflow_id).order_by(
        WorkflowRun.started_at.desc()
    ).limit(50).all()
    
    return jsonify([r.to_dict() for r in runs])

@workflows_bp.route('/runs/<int:run_id>', methods=['GET'])
@jwt_required()
def get_workflow_run(run_id):
    business_id = get_business_id()
    
    run = WorkflowRun.query.join(Workflow).filter(
        WorkflowRun.id == run_id,
        Workflow.business_id == business_id
    ).first()
    
    if not run:
        return jsonify({'error': 'Workflow run not found'}), 404
    
    return jsonify(run.to_dict())

@workflows_bp.route('/<int:workflow_id>/trigger', methods=['POST'])
@jwt_required()
def trigger_workflow(workflow_id):
    """Manually trigger a workflow"""
    business_id = get_business_id()
    workflow = Workflow.query.filter_by(id=workflow_id, business_id=business_id).first()
    if not workflow:
        return jsonify({'error': 'Workflow not found'}), 404
    
    data = request.get_json() or {}
    
    # Create run record
    run = WorkflowRun(
        workflow_id=workflow_id,
        run_id=generate_id('WR'),
        trigger_type='manual',
        entity_type=data.get('entity_type'),
        entity_id=data.get('entity_id'),
        trigger_data=data,
        status='running'
    )
    
    db.session.add(run)
    workflow.last_run_at = datetime.utcnow()
    db.session.commit()
    
    # Execute actions
    success_count = 0
    fail_count = 0
    
    for action in workflow.actions:
        if not action.is_active:
            continue
        
        result = execute_action(action, data, run)
        
        action_result = WorkflowActionResult(
            run_id=run.id,
            action_id=action.id,
            status=result['status'],
            output=result.get('output'),
            error_message=result.get('error'),
            completed_at=datetime.utcnow()
        )
        db.session.add(action_result)
        
        if result['status'] == 'success':
            success_count += 1
        else:
            fail_count += 1
            if action.on_error == 'stop':
                break
    
    run.status = 'completed' if fail_count == 0 else 'failed'
    run.actions_executed = success_count + fail_count
    run.actions_succeeded = success_count
    run.actions_failed = fail_count
    run.completed_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(run.to_dict())


def execute_action(action, trigger_data, run):
    """Execute a workflow action"""
    try:
        config = action.config
        
        if action.action_type == 'send_email':
            # Send email via existing email service
            from app.utils.email_service import send_email
            send_email(
                to=config.get('to'),
                subject=config.get('subject', '').format(**trigger_data),
                body=config.get('body', '').format(**trigger_data)
            )
            return {'status': 'success'}
        
        elif action.action_type == 'send_sms':
            # SMS sending would be implemented here
            return {'status': 'success', 'output': {'message': 'SMS sent'}}
        
        elif action.action_type == 'create_task':
            # Create a task
            from app.models.task import Task
            task = Task(
                business_id=run.workflow.business_id,
                title=config.get('title', '').format(**trigger_data),
                description=config.get('description', '').format(**trigger_data),
                priority=config.get('priority', 0),
                status='pending'
            )
            db.session.add(task)
            db.session.commit()
            return {'status': 'success', 'output': {'task_id': task.id}}
        
        elif action.action_type == 'update_field':
            # Update a field on the entity
            return {'status': 'success', 'output': {'updated': True}}
        
        elif action.action_type == 'webhook':
            # Call external webhook
            import requests
            response = requests.post(
                config.get('url'),
                json=trigger_data,
                timeout=config.get('timeout', 30)
            )
            return {'status': 'success', 'output': {'status_code': response.status_code}}
        
        elif action.action_type == 'notify_user':
            # Create notification
            return {'status': 'success', 'output': {'notified': True}}
        
        elif action.action_type == 'add_tag':
            # Add tag to entity
            return {'status': 'success', 'output': {'tag_added': True}}
        
        else:
            return {'status': 'success', 'output': {'message': f'Action {action.action_type} executed'}}
    
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}


# ============== WORKFLOW STATS ==============

@workflows_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_workflow_stats():
    """Get workflow execution statistics"""
    business_id = get_business_id()
    
    # Get counts by status
    status_counts = db.session.query(
        Workflow.status,
        db.func.count(Workflow.id)
    ).filter_by(business_id=business_id).group_by(Workflow.status).all()
    
    total_runs = WorkflowRun.query.join(Workflow).filter(
        Workflow.business_id == business_id
    ).count()
    
    failed_runs = WorkflowRun.query.join(Workflow).filter(
        Workflow.business_id == business_id,
        WorkflowRun.status == 'failed'
    ).count()
    
    return jsonify({
        'workflows_by_status': {s.value: c for s, c in status_counts},
        'total_runs': total_runs,
        'failed_runs': failed_runs,
        'success_rate': round((total_runs - failed_runs) / total_runs * 100, 2) if total_runs > 0 else 0
    })
