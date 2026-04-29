import os
import re

def get_modal_html(content, modal_id):
    start = content.find(f'<div id="{modal_id}"')
    if start == -1: return None
    
    # Simple depth counter to find the end
    depth = 0
    i = start
    while i < len(content):
        if content[i:].startswith('<div'):
            depth += 1
            i += 4
            continue
        elif content[i:].startswith('</div'):
            depth -= 1
            i += 5
            if depth == 0:
                return content[start:i+1] # +1 for the > which follows
            continue
        i += 1
    return None

def update_file(filepath, template_html):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    old_modal = get_modal_html(content, "modal-settings")
    if old_modal:
        content = content.replace(old_modal, template_html)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath} HTML")
    else:
        print(f"No modal-settings found in {filepath}")

with open('public/index.html', 'r', encoding='utf-8') as f:
    hub_content = f.read()

template = get_modal_html(hub_content, "modal-settings")
if template:
    template = template + ">" # Complete the div tag
    print("Template length:", len(template))
    
    import glob
    for file in glob.glob("public/*.html"):
        if "index.html" in file or "admin_users" in file: continue
        update_file(file, template)
else:
    print("Could not extract template.")
