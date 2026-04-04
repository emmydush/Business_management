import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, ListFlowable, ListItem
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT

def markdown_to_pdf(md_file, pdf_file):
    if not os.path.exists(md_file):
        print(f"Error: {md_file} not found.")
        return

    doc = SimpleDocTemplate(pdf_file, pagesize=A4,
                        rightMargin=72, leftMargin=72,
                        topMargin=72, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#2E3B4E')
    )
    
    heading2_style = ParagraphStyle(
        'Heading2Style',
        parent=styles['Heading2'],
        fontSize=18,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#3B5998'),
        borderPadding=5,
        borderColor=colors.lightgrey,
        borderWidth=0.5
    )
    
    heading3_style = ParagraphStyle(
        'Heading3Style',
        parent=styles['Heading3'],
        fontSize=14,
        spaceBefore=15,
        spaceAfter=8,
        textColor=colors.HexColor('#4B6EA9')
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        alignment=TA_JUSTIFY,
        spaceAfter=10
    )
    
    story = []
    
    with open(md_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line:
            story.append(Spacer(1, 6))
            continue
            
        # Title (# )
        if line.startswith('# '):
            story.append(Paragraph(line[2:], title_style))
            story.append(Spacer(1, 12))
            
        # Heading 2 (## )
        elif line.startswith('## '):
            story.append(Paragraph(line[3:], heading2_style))
            
        # Heading 3 (### )
        elif line.startswith('### '):
            story.append(Paragraph(line[4:], heading3_style))
            
        # Lists (- )
        elif line.startswith('- ') or line.startswith('* '):
            text = line[2:].replace('**', '<b>').replace('**', '</b>')
            # Basic bold rendering for reportlab
            import re
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            story.append(Paragraph(f"• {text}", body_style))
            
        # Horizontal Rule (---)
        elif line.startswith('---'):
            story.append(Spacer(1, 12))
            # Just a spacer for now, can add a line if needed
            
        # Paragraphs
        else:
            import re
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text) if 'text' in locals() else re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
            story.append(Paragraph(text, body_style))
            
    doc.build(story)
    print(f"Successfully generated {pdf_file}")

if __name__ == "__main__":
    md_path = r"e:\New folder\DOCUMENTATION.md"
    pdf_path = r"e:\New folder\AfriBiz_Documentation.pdf"
    markdown_to_pdf(md_path, pdf_path)
