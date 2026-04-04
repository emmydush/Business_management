import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors

def generate_simple_pdf(md_file, pdf_file):
    c = canvas.Canvas(pdf_file, pagesize=A4)
    width, height = A4
    y = height - 50 # Start from the top
    
    with open(md_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        # Simple ASCII only for robust generation
        line = line.encode('ascii', 'replace').decode('ascii')
        
        if not line:
            y -= 10
            continue
            
        if y < 50: # Trigger new page
            c.showPage()
            y = height - 50
            
        if line.startswith('# '):
            c.setFont("Helvetica-Bold", 18)
            c.drawString(50, y, line[2:])
            y -= 25
        elif line.startswith('## '):
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, y, line[3:])
            y -= 20
        elif line.startswith('### '):
            c.setFont("Helvetica-Bold", 12)
            c.drawString(50, y, line[4:])
            y -= 15
        elif line.startswith('- ') or line.startswith('* '):
            c.setFont("Helvetica", 10)
            c.drawString(60, y, "- " + line[2:].replace('**', ''))
            y -= 12
        else:
            c.setFont("Helvetica", 10)
            # Basic text wrapping
            text = line.replace('**', '')
            # Wrap at ~80 chars for simplicity
            line_wrap = 85
            words = text.split(' ')
            line_to_draw = ""
            for word in words:
                if len(line_to_draw) + len(word) < line_wrap:
                    line_to_draw += word + " "
                else:
                    c.drawString(50, y, line_to_draw)
                    y -= 12
                    line_to_draw = word + " "
                    if y < 50:
                        c.showPage()
                        y = height - 50
            c.drawString(50, y, line_to_draw)
            y -= 12
            
    c.save()
    print(f"Successfully generated {pdf_file}")

if __name__ == "__main__":
    md_path = r"e:\New folder\DOCUMENTATION.md"
    pdf_path = r"e:\New folder\AfriBiz_Documentation.pdf"
    generate_simple_pdf(md_path, pdf_path)
