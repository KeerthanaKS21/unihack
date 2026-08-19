import logging
import re
from typing import Dict, Any, List, Optional, Union
import pint

logger = logging.getLogger("unit_normalization_service")

# Initialize Pint Unit Registry
ureg = pint.UnitRegistry()
# Define industrial synonyms if needed
try:
    ureg.define('RPM = 1 * revolution / minute')
    ureg.define('rpm = 1 * RPM')
    ureg.define('r_min = 1 * RPM')
except Exception:
    pass

class UnitNormalizationService:
    """
    Deterministic Engineering Unit Normalization Engine.
    Converts raw industrial specifications into standardized canonical units
    using deterministic mathematical Pint transformations (No LLM arithmetic).
    """

    CANONICAL_TARGETS = {
        "power": {"target_unit": "kW", "type": "pint", "pint_unit": "kilowatt"},
        "voltage": {"target_unit": "V", "type": "pint", "pint_unit": "volt"},
        "frequency": {"target_unit": "Hz", "type": "pint", "pint_unit": "hertz"},
        "current": {"target_unit": "A", "type": "pint", "pint_unit": "ampere"},
        "speed": {"target_unit": "RPM", "type": "speed"},
        "weight": {"target_unit": "kg", "type": "pint", "pint_unit": "kilogram"},
        "torque": {"target_unit": "Nm", "type": "pint", "pint_unit": "newton * meter"},
        "ip_rating": {"type": "string_clean"},
        "duty_cycle": {"type": "string_clean"},
        "insulation_class": {"type": "string_clean"},
        "mounting": {"type": "string_clean"},
        "compliance": {"type": "string_clean"},
    }

    @classmethod
    def normalize_specification(cls, spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize a single specification item without mutating raw values.
        """
        attr_name = spec.get("attribute_name", "").lower()
        raw_val = spec.get("value")
        raw_unit = spec.get("unit")
        raw_str = str(spec.get("raw_value") or raw_val or "").strip()

        target_info = cls.CANONICAL_TARGETS.get(attr_name)
        if not target_info or raw_val is None:
            return {
                "attribute_name": spec.get("attribute_name"),
                "raw_value": raw_val,
                "raw_unit": raw_unit,
                "normalized_value": raw_val,
                "normalized_unit": raw_unit,
                "normalization_status": "NOT_NORMALIZED",
                "source_text": spec.get("source_text"),
                "source": spec.get("source"),
                "model_confidence": spec.get("model_confidence")
            }

        norm_type = target_info.get("type")

        # 1. Pint Scientific Conversions (Power, Voltage, Frequency, Current, Weight, Torque)
        if norm_type == "pint" and isinstance(raw_val, (int, float)):
            target_unit_str = target_info["target_unit"]
            pint_unit_name = target_info["pint_unit"]

            # Map raw unit synonyms to pint
            unit_map = {
                "w": "watt",
                "kw": "kilowatt",
                "mw": "megawatt",
                "hp": "horsepower",
                "v": "volt",
                "kv": "kilovolt",
                "vac": "volt",
                "vdc": "volt",
                "volts": "volt",
                "hz": "hertz",
                "khz": "kilohertz",
                "a": "ampere",
                "amps": "ampere",
                "ma": "milliampere",
                "kg": "kilogram",
                "g": "gram",
                "lbs": "pound",
                "lb": "pound",
                "tonne": "metric_ton",
                "nm": "newton * meter",
                "n-m": "newton * meter"
            }

            clean_raw_u = (raw_unit or "").lower().strip()
            source_pint_unit = unit_map.get(clean_raw_u)

            if source_pint_unit:
                try:
                    qty = raw_val * ureg(source_pint_unit)
                    converted = qty.to(pint_unit_name)
                    norm_val = round(converted.magnitude, 4)
                    if norm_val == int(norm_val):
                        norm_val = int(norm_val)

                    return {
                        "attribute_name": spec.get("attribute_name"),
                        "raw_value": raw_val,
                        "raw_unit": raw_unit,
                        "normalized_value": norm_val,
                        "normalized_unit": target_unit_str,
                        "normalization_status": "NORMALIZED",
                        "source_text": spec.get("source_text"),
                        "source": spec.get("source"),
                        "model_confidence": spec.get("model_confidence")
                    }
                except Exception as conv_err:
                    logger.warning(f"Pint conversion failed for {attr_name} ({raw_val} {raw_unit}): {conv_err}")

        # 2. Rotational Speed (RPM, r/min, rpm, min^-1)
        elif norm_type == "speed" and isinstance(raw_val, (int, float)):
            clean_u = (raw_unit or "").lower().strip()
            if clean_u in ["rpm", "r/min", "min^-1", "min-1", "r_min", ""]:
                return {
                    "attribute_name": spec.get("attribute_name"),
                    "raw_value": raw_val,
                    "raw_unit": raw_unit or "RPM",
                    "normalized_value": int(raw_val) if raw_val == int(raw_val) else raw_val,
                    "normalized_unit": "RPM",
                    "normalization_status": "NORMALIZED",
                    "source_text": spec.get("source_text"),
                    "source": spec.get("source"),
                    "model_confidence": spec.get("model_confidence")
                }

        # 3. String Canonicalization (IP Rating, Duty Cycle, Insulation)
        elif norm_type == "string_clean":
            cleaned_str = str(raw_val).strip()
            if attr_name == "ip_rating":
                cleaned_str = re.sub(r'[\s\-]', '', cleaned_str.upper())
            elif attr_name == "duty_cycle":
                if cleaned_str.lower().startswith("s1"):
                    cleaned_str = "S1 Continuous"
            elif attr_name == "insulation_class":
                if not cleaned_str.lower().startswith("class"):
                    cleaned_str = f"Class {cleaned_str.upper()}"

            return {
                "attribute_name": spec.get("attribute_name"),
                "raw_value": raw_val,
                "raw_unit": raw_unit,
                "normalized_value": cleaned_str,
                "normalized_unit": None,
                "normalization_status": "NORMALIZED",
                "source_text": spec.get("source_text"),
                "source": spec.get("source"),
                "model_confidence": spec.get("model_confidence")
            }

        # Fallback if no matching conversion path
        return {
            "attribute_name": spec.get("attribute_name"),
            "raw_value": raw_val,
            "raw_unit": raw_unit,
            "normalized_value": raw_val,
            "normalized_unit": raw_unit,
            "normalization_status": "NOT_NORMALIZED",
            "source_text": spec.get("source_text"),
            "source": spec.get("source"),
            "model_confidence": spec.get("model_confidence")
        }

    @classmethod
    def normalize_specifications_list(cls, specs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Normalize an entire list of specification dicts.
        """
        return [cls.normalize_specification(s) for s in specs]
