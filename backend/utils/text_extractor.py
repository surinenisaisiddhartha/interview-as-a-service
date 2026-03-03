import io

from log import log_tool
from pypdf import PdfReader

class TextExtractor:
    """
    Utility to extract text from various file formats.
    """
    
    @staticmethod
    def extract_text(file_bytes: bytes, filename: str) -> str:
        """
        Extracts text based on file extension.

        Args:
            file_bytes: The binary content of the file.
            filename: The name of the file to determine type.

        Returns:
            The extracted text, or empty string if unsupported/failed.
        """
        if filename.lower().endswith(".pdf"):
            return TextExtractor._read_pdf(file_bytes)
        if filename.lower().endswith(".txt"):
            return TextExtractor._read_txt(file_bytes)
        log_tool.log_warning("Unsupported file type: %s" % filename)
        return ""

    @staticmethod
    def _read_pdf(file_bytes: bytes) -> str:
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text = []
            for page in reader.pages:
                text.append(page.extract_text() or "")
            return "\n".join(text)
        except Exception as e:
            log_tool.log_error("Error reading PDF: %s" % e)
            return ""

    @staticmethod
    def _read_txt(file_bytes: bytes) -> str:
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            log_tool.log_error("Error reading TXT: %s" % e)
            return ""
