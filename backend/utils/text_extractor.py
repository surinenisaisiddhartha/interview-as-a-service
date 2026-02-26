import logging
import io
from pypdf import PdfReader

logger = logging.getLogger(__name__)

class TextExtractor:
    """
    Utility to extract text from various file formats.
    """
    
    @staticmethod
    def extract_text(file_content: bytes, filename: str) -> str:
        """
        Extracts text based on file extension.
        
        Args:
            file_content (bytes): The binary content of the file.
            filename (str): The name of the file to determine type.
            
        Returns:
            str: The extracted text.
        """
        if filename.lower().endswith('.pdf'):
            return TextExtractor._read_pdf(file_content)
        elif filename.lower().endswith('.txt'):
            return TextExtractor._read_txt(file_content)
        else:
            logger.warning(f"Unsupported file type: {filename}")
            return ""

    @staticmethod
    def _read_pdf(file_content: bytes) -> str:
        try:
            reader = PdfReader(io.BytesIO(file_content))
            text = []
            for page in reader.pages:
                text.append(page.extract_text() or "")
            return "\n".join(text)
        except Exception as e:
            logger.error(f"Error reading PDF: {e}")
            return ""

    @staticmethod
    def _read_txt(file_content: bytes) -> str:
        try:
            return file_content.decode('utf-8', errors='ignore')
        except Exception as e:
            logger.error(f"Error reading TXT: {e}")
            return ""
