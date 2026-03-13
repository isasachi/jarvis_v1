import re


def split_sentences(text: str) -> list[str]:
    """
    Divide el texto en oraciones por: . ! ?
    Mantiene oraciones cortas juntas para evitar cortes antinaturales.
    Mínimo 30 caracteres por fragmento para evitar demasiados splits.
    """
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    result = []
    buffer = ""

    for s in sentences:
        buffer = (buffer + " " + s).strip()
        if len(buffer) >= 30:
            result.append(buffer)
            buffer = ""

    if buffer:
        result.append(buffer)

    return result
