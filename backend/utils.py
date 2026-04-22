from datetime import datetime
from sqlalchemy.orm import Session
from models import UsageLog

def record_usage(db: Session, api_key_id: str):
    """Record an API hit in the hourly bucket."""
    now = datetime.utcnow()
    # Bucket format: "2024-04-22 14:00"
    hour_bucket = now.strftime("%Y-%m-%d %H:00")
    
    log = db.query(UsageLog).filter(
        UsageLog.api_key_id == api_key_id,
        UsageLog.bucket_hour == hour_bucket
    ).first()
    
    if log:
        log.count += 1
    else:
        log = UsageLog(
            api_key_id=api_key_id,
            bucket_hour=hour_bucket,
            count=1
        )
        db.add(log)
    
    db.commit()
