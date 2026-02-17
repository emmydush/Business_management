from app import db
from datetime import datetime
from enum import Enum

class WorkflowStatus(Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    INACTIVE = "inactive"

class TriggerType(Enum):
    EVENT = "event"  # Based on entity events
    SCHEDULE = "schedule"  # Time-based
    MANUAL = "manual"  # Manual trigger

class ActionType(Enum):
    SEND_EMAIL = "send_email"
    SEND_SMS = "send_sms"
    UPDATE_FIELD = "update_field"
    CREATE_TASK = "create_task"
    ADD_TAG = "add_tag"
    REMOVE_TAG = "remove_tag"
    WEBHOOK = "webhook"
    NOTIFY_USER = "notify_user"
    CHANGE_STATUS = "change_status"
    CREATE_RECORD = "create_record"
    SEND_NOTIFICATION = "send_notification"

class Workflow(db.Model):
    __tablename__ = 'workflows'
    
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    branch_id = db.Column(db.Integer, db.ForeignKey('branches.id'), nullable=True)
    
    workflow_id = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Workflow configuration
    status = db.Column(db.Enum(WorkflowStatus), default=WorkflowStatus.DRAFT, nullable=False)
    priority = db.Column(db.Integer, default=0)
    
    # Run settings
    trigger_type = db.Column(db.Enum(TriggerType), nullable=False)
    max_runs_per_day = db.Column(db.Integer, default=1000)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_run_at = db.Column(db.DateTime)
    
    # Relationships
    business = db.relationship('Business', backref='workflows')
    branch = db.relationship('Branch', backref='workflows')
    creator = db.relationship('User', backref='workflows')
    triggers = db.relationship('WorkflowTrigger', back_populates='workflow', lazy=True, cascade='all, delete-orphan')
    actions = db.relationship('WorkflowAction', back_populates='workflow', lazy=True, cascade='all, delete-orphan')
    runs = db.relationship('WorkflowRun', back_populates='workflow', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('business_id', 'workflow_id', name='_business_workflow_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'branch_id': self.branch_id,
            'workflow_id': self.workflow_id,
            'name': self.name,
            'description': self.description,
            'status': self.status.value,
            'priority': self.priority,
            'trigger_type': self.trigger_type.value,
            'max_runs_per_day': self.max_runs_per_day,
            'is_active': self.is_active,
            'created_by': self.created_by,
            'triggers': [t.to_dict() for t in self.triggers],
            'actions': [a.to_dict() for a in self.actions],
            'run_count': len(self.runs),
            'last_run_at': self.last_run_at.isoformat() if self.last_run_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class WorkflowTrigger(db.Model):
    __tablename__ = 'workflow_triggers'
    
    id = db.Column(db.Integer, primary_key=True)
    workflow_id = db.Column(db.Integer, db.ForeignKey('workflows.id'), nullable=False)
    
    trigger_type = db.Column(db.String(50), nullable=False)
    
    # Event trigger configuration
    entity_type = db.Column(db.String(50))  # order, invoice, customer, lead, etc.
    event_type = db.Column(db.String(50))  # created, updated, deleted, status_changed
    event_filters = db.Column(db.JSON)  # Additional filters
    
    # Schedule trigger configuration
    schedule_type = db.Column(db.String(20))  # daily, weekly, monthly, custom
    schedule_time = db.Column(db.Time)
    schedule_days = db.Column(db.JSON)  # For weekly: [0,1,2,3,4] (Mon-Fri)
    schedule_cron = db.Column(db.String(100))  # Custom cron expression
    
    # Conditions
    conditions = db.Column(db.JSON)  # [{"field": "total_amount", "operator": ">", "value": 1000}]
    conditions_logic = db.Column(db.String(10), default='AND')
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    workflow = db.relationship('Workflow', back_populates='triggers')
    
    def to_dict(self):
        return {
            'id': self.id,
            'workflow_id': self.workflow_id,
            'trigger_type': self.trigger_type,
            'entity_type': self.entity_type,
            'event_type': self.event_type,
            'event_filters': self.event_filters,
            'schedule_type': self.schedule_type,
            'schedule_time': self.schedule_time.strftime('%H:%M') if self.schedule_time else None,
            'schedule_days': self.schedule_days,
            'schedule_cron': self.schedule_cron,
            'conditions': self.conditions,
            'conditions_logic': self.conditions_logic,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class WorkflowAction(db.Model):
    __tablename__ = 'workflow_actions'
    
    id = db.Column(db.Integer, primary_key=True)
    workflow_id = db.Column(db.Integer, db.ForeignKey('workflows.id'), nullable=False)
    
    sequence = db.Column(db.Integer, nullable=False)
    action_type = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    
    # Action configuration (JSON)
    config = db.Column(db.JSON, nullable=False)
    
    # Delay before executing (in seconds)
    delay_seconds = db.Column(db.Integer, default=0)
    
    # Error handling
    on_error = db.Column(db.String(20), default='stop')  # stop, continue, retry
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    workflow = db.relationship('Workflow', back_populates='actions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'workflow_id': self.workflow_id,
            'sequence': self.sequence,
            'action_type': self.action_type,
            'name': self.name,
            'config': self.config,
            'delay_seconds': self.delay_seconds,
            'on_error': self.on_error,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class WorkflowRun(db.Model):
    __tablename__ = 'workflow_runs'
    
    id = db.Column(db.Integer, primary_key=True)
    workflow_id = db.Column(db.Integer, db.ForeignKey('workflows.id'), nullable=False)
    
    run_id = db.Column(db.String(50), nullable=False)
    trigger_type = db.Column(db.String(50), nullable=False)
    
    # Trigger data
    entity_type = db.Column(db.String(50))
    entity_id = db.Column(db.Integer)
    trigger_data = db.Column(db.JSON)
    
    # Status
    status = db.Column(db.String(20), nullable=False)  # running, completed, failed
    
    # Results
    actions_executed = db.Column(db.Integer, default=0)
    actions_succeeded = db.Column(db.Integer, default=0)
    actions_failed = db.Column(db.Integer, default=0)
    
    error_message = db.Column(db.Text)
    
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    workflow = db.relationship('Workflow', back_populates='runs')
    action_results = db.relationship('WorkflowActionResult', back_populates='run', lazy=True, cascade='all, delete-orphan')
    
    __table_args__ = (db.UniqueConstraint('workflow_id', 'run_id', name='_workflow_run_id_uc'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'workflow_id': self.workflow_id,
            'run_id': self.run_id,
            'trigger_type': self.trigger_type,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'trigger_data': self.trigger_data,
            'status': self.status,
            'actions_executed': self.actions_executed,
            'actions_succeeded': self.actions_succeeded,
            'actions_failed': self.actions_failed,
            'error_message': self.error_message,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'action_results': [r.to_dict() for r in self.action_results]
        }


class WorkflowActionResult(db.Model):
    __tablename__ = 'workflow_action_results'
    
    id = db.Column(db.Integer, primary_key=True)
    run_id = db.Column(db.Integer, db.ForeignKey('workflow_runs.id'), nullable=False)
    action_id = db.Column(db.Integer, db.ForeignKey('workflow_actions.id'), nullable=False)
    
    status = db.Column(db.String(20), nullable=False)  # success, failed, skipped
    output = db.Column(db.JSON)  # Action output data
    error_message = db.Column(db.Text)
    
    executed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    run = db.relationship('WorkflowRun', back_populates='action_results')
    action = db.relationship('WorkflowAction')
    
    def to_dict(self):
        return {
            'id': self.id,
            'run_id': self.run_id,
            'action_id': self.action_id,
            'status': self.status,
            'output': self.output,
            'error_message': self.error_message,
            'executed_at': self.executed_at.isoformat() if self.executed_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
