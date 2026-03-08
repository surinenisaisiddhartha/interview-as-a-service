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
        if filename.lower().endswith(".docx"):
            return TextExtractor._read_docx(file_bytes)
        if filename.lower().endswith(".doc"):
            return TextExtractor._read_doc(file_bytes)
        
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

    @staticmethod
    def _read_doc(file_bytes: bytes) -> str:
        try:
            import string
            import re
            
            # Legacy .doc files store text typically in utf-16-le chunks.
            # Convert to printable ASCII safely to pass to LLM.
            decoded_ascii = file_bytes.decode('ascii', errors='ignore')
            decoded_utf16 = file_bytes.decode('utf-16-le', errors='ignore')
            
            valid_chars = set(string.printable)
            ascii_text = "".join(c for c in decoded_ascii if c in valid_chars)
            utf16_text = "".join(c for c in decoded_utf16 if c in valid_chars)
            
            # Clean up excessive whitespace and combine
            text = ascii_text + " \n " + utf16_text
            text = re.sub(r'\s+', ' ', text).strip()
            
            return text
        except Exception as e:
            log_tool.log_error("Error reading DOC heuristic: %s" % e)
            return ""

    @staticmethod
    def _read_docx(file_bytes: bytes) -> str:
        try:
            from docx import Document
            document = Document(io.BytesIO(file_bytes))
            text = [paragraph.text for paragraph in document.paragraphs]
            return "\n".join(text)
        except Exception as e:
            log_tool.log_error("Error reading DOCX: %s" % e)
            return ""
