"""
Converte LEVANTAMENTO_SUBSIDIOS_TRABALHISTAS.md para HTML e gera PDF via Edge headless.
Usa apenas módulos da biblioteca padrão do Python.
"""
import re, sys, os, subprocess, textwrap

MD_FILE = os.path.join(os.path.dirname(__file__), "LEVANTAMENTO_SUBSIDIOS_TRABALHISTAS.md")
HTML_FILE = os.path.join(os.path.dirname(__file__), "LEVANTAMENTO_SUBSIDIOS_TRABALHISTAS.html")
PDF_FILE  = os.path.join(os.path.dirname(__file__), "LEVANTAMENTO_SUBSIDIOS_TRABALHISTAS.pdf")
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def md_to_html(text):
    lines = text.split("\n")
    html_lines = []
    in_code = False
    in_ul = False
    in_table = False
    i = 0
    while i < len(lines):
        line = lines[i]

        # --- code block ---
        if line.strip().startswith("```"):
            if not in_code:
                if in_ul:
                    html_lines.append("</ul>"); in_ul = False
                if in_table:
                    html_lines.append("</tbody></table>"); in_table = False
                html_lines.append("<pre><code>")
                in_code = True
            else:
                html_lines.append("</code></pre>")
                in_code = False
            i += 1
            continue

        if in_code:
            html_lines.append(escape(line))
            i += 1
            continue

        # --- table ---
        if line.strip().startswith("|"):
            if in_ul:
                html_lines.append("</ul>"); in_ul = False
            parts = [p.strip() for p in line.strip().strip("|").split("|")]
            # header separator?
            if all(re.fullmatch(r"[-: ]+", p) for p in parts):
                i += 1
                continue
            if not in_table:
                html_lines.append('<table><thead><tr>')
                html_lines.append("".join(f"<th>{escape(p)}</th>" for p in parts))
                html_lines.append('</tr></thead><tbody>')
                in_table = True
            else:
                html_lines.append("<tr>")
                html_lines.append("".join(f"<td>{inline(escape(p))}</td>" for p in parts))
                html_lines.append("</tr>")
            i += 1
            continue
        elif in_table:
            html_lines.append("</tbody></table>"); in_table = False

        # --- headings ---
        m = re.match(r"^(#{1,6})\s+(.*)", line)
        if m:
            if in_ul:
                html_lines.append("</ul>"); in_ul = False
            level = len(m.group(1))
            html_lines.append(f"<h{level}>{inline(escape(m.group(2)))}</h{level}>")
            i += 1
            continue

        # --- hr ---
        if re.match(r"^---+\s*$", line.strip()):
            if in_ul:
                html_lines.append("</ul>"); in_ul = False
            html_lines.append("<hr>")
            i += 1
            continue

        # --- list ---
        m = re.match(r"^[-*]\s+(.*)", line)
        if m:
            if not in_ul:
                html_lines.append("<ul>"); in_ul = True
            html_lines.append(f"<li>{inline(escape(m.group(1)))}</li>")
            i += 1
            continue

        # numbered list
        m = re.match(r"^\d+\.\s+(.*)", line)
        if m:
            if in_ul:
                html_lines.append("</ul>"); in_ul = False
            html_lines.append(f"<li>{inline(escape(m.group(1)))}</li>")
            i += 1
            continue

        # blank line
        if line.strip() == "":
            if in_ul:
                html_lines.append("</ul>"); in_ul = False
            html_lines.append("<br>")
            i += 1
            continue

        # normal paragraph
        html_lines.append(f"<p>{inline(escape(line))}</p>")
        i += 1

    if in_ul:
        html_lines.append("</ul>")
    if in_table:
        html_lines.append("</tbody></table>")
    return "\n".join(html_lines)

def escape(s):
    return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")

def inline(s):
    # bold
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    # italic
    s = re.sub(r"\*(.+?)\*", r"<em>\1</em>", s)
    # inline code
    s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
    # links
    s = re.sub(r"\[(.+?)\]\((.+?)\)", r'<a href="\2">\1</a>', s)
    # emoji passthrough (already unicode)
    return s

CSS = textwrap.dedent("""
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: 'Inter', Arial, sans-serif;
        font-size: 11pt;
        color: #1a1a1a;
        line-height: 1.7;
        padding: 40px 60px;
        max-width: 900px;
        margin: auto;
    }
    h1 { font-size: 20pt; color: #003087; border-bottom: 3px solid #003087; padding-bottom: 6px; margin: 24px 0 8px; }
    h2 { font-size: 14pt; color: #003087; border-bottom: 1px solid #ccd; padding-bottom: 4px; margin: 20px 0 6px; }
    h3 { font-size: 12pt; color: #005aaa; margin: 14px 0 4px; }
    p  { margin: 6px 0; }
    hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
    ul, ol { margin: 6px 0 6px 24px; }
    li { margin: 3px 0; }
    pre { background: #f4f4f4; border: 1px solid #ddd; border-radius: 4px; padding: 12px; font-size: 9pt; overflow-x: auto; margin: 8px 0; white-space: pre-wrap; }
    code { background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 9pt; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 10pt; }
    th { background: #003087; color: #fff; padding: 7px 10px; text-align: left; }
    td { border: 1px solid #ccc; padding: 6px 10px; }
    tr:nth-child(even) td { background: #f7f7f7; }
    strong { color: #111; }
    a { color: #005aaa; }
    @page { margin: 2cm; }
""")

def build_html(body):
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Levantamento de Requisitos — Subsídios Trabalhistas</title>
<style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>"""

if __name__ == "__main__":
    with open(MD_FILE, encoding="utf-8") as f:
        md = f.read()

    body = md_to_html(md)
    html = build_html(body)

    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"HTML gerado: {HTML_FILE}")

    # Print to PDF via Edge headless
    file_url = "file:///" + HTML_FILE.replace("\\", "/").replace(" ", "%20")
    cmd = [
        EDGE,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={PDF_FILE}",
        file_url,
    ]
    print("Gerando PDF...")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if os.path.exists(PDF_FILE):
        print(f"PDF gerado com sucesso: {PDF_FILE}")
    else:
        print("Falha ao gerar PDF via Edge.")
        print(result.stderr)
        sys.exit(1)
