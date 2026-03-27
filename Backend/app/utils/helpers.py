
import re

def extract_dg_class(value: str | None) -> str | None:
    if not value:
        return None

    match = re.search(r"class\s*(\d+)", value, re.IGNORECASE)

    if match:
        return f"Class {match.group(1)}"

    return None