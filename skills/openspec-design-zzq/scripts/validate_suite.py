#!/usr/bin/env python3
"""Validate the ten ZZQ entrypoints, references and optional Claude links.

Uses the existing PyYAML package. No application execution or file mutation.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re
import sys
import yaml

EXPECTED={f'openspec-{name}-zzq' for name in ('grill-with-docs','explore','prototype','design','apply','review','debug','retro','handoff','archive')}
LINK=re.compile(r'(?<!!)\[[^\]\n]+\]\(([^\s)]+)\)')
CALL=re.compile(r'\$([a-z][a-z0-9-]+)')

def validate(base: Path, claude: Path | None) -> dict:
    base=base.resolve()
    refs=base/'openspec-design-zzq/references'
    catalog=json.loads((refs/'catalog.json').read_text())
    names=[item['name'] for item in catalog['skills']]
    errors=[]
    if set(names)!=EXPECTED or len(names)!=len(EXPECTED):
        errors.append('Expected exactly the ten agreed independent entrypoints')
    installed={p.name for p in base.glob('openspec-*-zzq') if p.is_dir()}
    if installed - {'openspec-setup-zzq'} != EXPECTED:
        errors.append(f'Unexpected/missing entrypoints: {sorted(installed ^ EXPECTED)}')
    methods=catalog.get('methods',[])
    if len(methods)!=17 or len({m['name'] for m in methods})!=17:
        errors.append('Expected 17 distinct method mappings')
    for method in methods:
        path=(refs/method['reference']).resolve()
        if method.get('route') not in EXPECTED or not method.get('trigger') or not method.get('artifact') or not path.is_relative_to(base) or not path.relative_to(base).parts or path.relative_to(base).parts[0] not in EXPECTED or not path.is_file():
            errors.append(f'Invalid method mapping: {method.get("name")}')
    details=[]
    for name in names:
        folder=base/name
        try:
            raw=(folder/'SKILL.md').read_text()
            parts=raw.split('---',2)
            if len(parts)!=3 or parts[0].strip():
                raise ValueError('Invalid frontmatter')
            meta=yaml.safe_load(parts[1])
            if meta['name']!=name or meta.get('metadata',{}).get('suite')!='openspec-zzq' or str(meta.get('metadata',{}).get('version'))!=catalog['bundle_version']:
                errors.append(f'{name}: metadata/catalog mismatch')
            if not meta.get('description') or len(meta['description'])>1024 or len(raw.splitlines())>=500:
                errors.append(f'{name}: invalid description or oversized entrypoint')
            if list(folder.glob('**/SKILL.md'))!=[folder/'SKILL.md']:
                errors.append(f'{name}: hidden duplicate skill entrypoint')
            face=yaml.safe_load((folder/'agents/openai.yaml').read_text())
            ui=face['interface']
            if '$'+name not in ui.get('default_prompt','') or not 25<=len(ui.get('short_description',''))<=64:
                errors.append(f'{name}: invalid UI metadata')
            if face.get('policy',{}).get('allow_implicit_invocation') is False:
                errors.append(f'{name}: invocation policy changed without request')
            for p in folder.rglob('*.md'):
                text=p.read_text()
                for dest in LINK.findall(text):
                    if dest.startswith(('http:','https:','mailto:','#')): continue
                    target=(p.parent/dest.split('#',1)[0]).resolve()
                    if not target.is_relative_to(base) or not target.relative_to(base).parts or target.relative_to(base).parts[0] not in EXPECTED or not target.exists():
                        errors.append(f'{p.relative_to(base)}: broken/outside link {dest}')
                for call in CALL.findall(text):
                    if call.startswith('openspec-') and call not in EXPECTED:
                        errors.append(f'{p.relative_to(base)}: retired skill call {call}')
            if claude is not None:
                alias=claude/name
                if not alias.is_symlink() or alias.resolve()!=folder:
                    errors.append(f'{name}: invalid Claude link')
            details.append({'name':name,'lines':len(raw.splitlines())})
        except (OSError,ValueError,KeyError,TypeError,yaml.YAMLError) as exc:
            errors.append(f'{name}: {exc}')
    if claude is not None:
        aliases={p.name for p in claude.glob('openspec-*-zzq')}
        if aliases - {'openspec-setup-zzq'} != EXPECTED:
            errors.append(f'Unexpected/missing Claude aliases: {sorted(aliases ^ EXPECTED)}')
    return {'status':'FAIL' if errors else 'PASS','skills':len(names),'methods':len(methods),'errors':errors,'details':details,'scope':'Packaging and reference checks, not model behavior or business acceptance.'}

def main() -> int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--skills-root',type=Path,default=Path(__file__).resolve().parents[2])
    parser.add_argument('--claude-root',type=Path)
    args=parser.parse_args()
    try: result=validate(args.skills_root,args.claude_root)
    except (OSError,ValueError,KeyError,TypeError,yaml.YAMLError) as exc:
        result={'status':'FAIL','errors':[str(exc)]}
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return 0 if result['status']=='PASS' else 1

if __name__=='__main__':
    sys.exit(main())
