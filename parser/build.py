"""Convert a grouped raw record (from grouping.group_table_rows) into a
validated Institution model, applying the field-level extraction helpers."""

from extraction import (
    clean_address,
    extract_emails,
    extract_name,
    extract_phones,
    extract_registration_number,
    extract_website,
    has_cancellation_notice,
    split_qualifications,
)
from models import Contacts, Institution


def record_to_institution(record):
    """Returns an Institution, or None if the record has no parseable name
    (e.g. a malformed/irregular row that shouldn't crash the pipeline)."""
    name = extract_name(record.get("name_block", ""))
    if not name:
        return None

    name_block = record.get("name_block", "")
    province = record.get("province", "").strip() or None
    status = "Cancelled" if has_cancellation_notice(name_block) else record.get("status")

    return Institution(
        name=name,
        registration_number=extract_registration_number(record.get("registration_number", "")),
        status=status,
        address=clean_address(record.get("address_block", "")),
        province=province,
        contacts=Contacts(
            email=extract_emails(name_block),
            phone=extract_phones(name_block),
            website=extract_website(name_block),
        ),
        qualifications=split_qualifications(record.get("qualifications_block", "")),
    )
