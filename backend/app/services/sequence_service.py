# ~/Bizzy_store/backend/app/services/sequence_service.py - FIXED VERSION
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, OperationalError
from app.models.business_sequence import BusinessSequence
import time
import logging

logger = logging.getLogger(__name__)

class SequenceService:
    @staticmethod
    def get_next_number(db: Session, business_id: int, entity_type: str) -> int:
        """
        Atomically get the next sequence number for a business and entity type.
        Uses database-level locking with retry logic to prevent race conditions.
        """
        max_retries = 3
        retry_delay = 0.1  # seconds

        for attempt in range(max_retries):
            try:
                # Start transaction and lock the sequence row
                sequence = db.query(BusinessSequence).filter(
                    BusinessSequence.business_id == business_id,
                    BusinessSequence.entity_type == entity_type
                ).with_for_update().first()

                if not sequence:
                    # Create new sequence if it doesn't exist
                    sequence = BusinessSequence(
                        business_id=business_id,
                        entity_type=entity_type,
                        last_number=0
                    )
                    db.add(sequence)
                    db.flush()  # Flush to get the ID without committing
                    logger.info(f"Created new sequence for business {business_id}, entity {entity_type}")

                # Increment and return the next number
                sequence.last_number += 1
                next_number = sequence.last_number
                db.flush()  # FIXED: Use flush instead of commit to work within transaction

                logger.debug(f"Generated {entity_type} number {next_number} for business {business_id}")
                return next_number

            except (IntegrityError, OperationalError) as e:
                db.rollback()
                logger.warning(f"Sequence generation attempt {attempt + 1} failed: {str(e)}")

                if attempt == max_retries - 1:  # Last attempt
                    logger.error(f"Failed to generate sequence number after {max_retries} attempts: {str(e)}")
                    raise Exception(f"Failed to generate sequence number after {max_retries} attempts: {str(e)}")

                # Wait before retry
                time.sleep(retry_delay)
                continue

            except Exception as e:
                db.rollback()
                logger.error(f"Unexpected error in sequence generation: {str(e)}")
                if attempt == max_retries - 1:
                    raise Exception(f"Failed to generate sequence number: {str(e)}")
                time.sleep(retry_delay)
                continue

    @staticmethod
    def get_current_number(db: Session, business_id: int, entity_type: str) -> int:
        """Get the current sequence number without incrementing"""
        sequence = db.query(BusinessSequence).filter(
            BusinessSequence.business_id == business_id,
            BusinessSequence.entity_type == entity_type
        ).first()

        return sequence.last_number if sequence else 0

    @staticmethod
    def initialize_sequence(db: Session, business_id: int, entity_type: str, start_number: int = 0):
        """Initialize or reset a sequence"""
        sequence = db.query(BusinessSequence).filter(
            BusinessSequence.business_id == business_id,
            BusinessSequence.entity_type == entity_type
        ).first()

        if sequence:
            sequence.last_number = start_number
        else:
            sequence = BusinessSequence(
                business_id=business_id,
                entity_type=entity_type,
                last_number=start_number
            )
            db.add(sequence)

        db.commit()
        logger.info(f"Initialized {entity_type} sequence for business {business_id} to {start_number}")
        return sequence

    @staticmethod
    def ensure_all_sequences(db: Session, business_id: int):
        """Ensure a business has sequences for all entity types"""
        entity_types = ['sale', 'refund', 'product', 'expense', 'inventory']
        created = []

        for entity_type in entity_types:
            sequence = db.query(BusinessSequence).filter(
                BusinessSequence.business_id == business_id,
                BusinessSequence.entity_type == entity_type
            ).first()

            if not sequence:
                sequence = BusinessSequence(
                    business_id=business_id,
                    entity_type=entity_type,
                    last_number=0
                )
                db.add(sequence)
                created.append(entity_type)

        if created:
            db.commit()
            logger.info(f"Created missing sequences for business {business_id}: {created}")

        return created

    @staticmethod
    def sync_sequence_with_data(db: Session, business_id: int, entity_type: str, model_class):
        """
        Synchronize sequence with existing data to prevent gaps.
        Useful after data fixes or migrations.
        """
        # Get the current max business number from actual data
        max_business_number = db.query(db.func.max(model_class.business_sale_number)).filter(
            model_class.business_id == business_id
        ).scalar() or 0

        # Get current sequence value
        sequence = db.query(BusinessSequence).filter(
            BusinessSequence.business_id == business_id,
            BusinessSequence.entity_type == entity_type
        ).first()

        if sequence:
            if sequence.last_number < max_business_number:
                sequence.last_number = max_business_number
                db.commit()
                logger.info(f"Synced {entity_type} sequence for business {business_id} to {max_business_number}")
                return True

        return False
