import json
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ResponseSaver:
    """
    Utility class to save JSON responses to local files.
    """
    
    @staticmethod
    def save_json(data: dict, output_dir: str, filename_prefix: str) -> str:
        """
        Saves a dictionary as a JSON file.
        
        Args:
            data (dict): The data to save.
            output_dir (str): The directory specifically for this type of output.
            filename_prefix (str): Prefix for the filename.
            
        Returns:
            str: The absolute path of the saved file.
        """
        try:
            # Ensure the directory exists
            os.makedirs(output_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{filename_prefix}_{timestamp}.json"
            filepath = os.path.join(output_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                
            logger.info(f"Successfully saved output to {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Failed to save JSON file: {e}")
            return ""
