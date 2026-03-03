import json
import os
from datetime import datetime

from log import log_tool


class JsonFileSaver:
    """
    Saves a dictionary as a timestamped JSON file under a given directory.
    Returns the file path on success, or empty string on failure.
    """

    @staticmethod
    def save_json(data: dict, output_dir: str, filename_prefix: str) -> str:
        """
        Saves a dictionary as a JSON file.

        Args:
            data: The data to save.
            output_dir: The directory for this type of output.
            filename_prefix: Prefix for the filename.

        Returns:
            The absolute path of the saved file, or "" on failure.
        """
        try:
            os.makedirs(output_dir, exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{filename_prefix}_{timestamp}.json"
            filepath = os.path.join(output_dir, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            log_tool.log_info("Successfully saved output to %s" % filepath)
            return filepath
        except Exception as e:
            log_tool.log_error("Failed to save JSON file: %s" % e)
            return ""
