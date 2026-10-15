#!/usr/bin/env python3
"""Build release listings from explicit artifacts/receipts, never installed state.

The separate catalog-sign helper signs catalog-source.json using Keychain.
"""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import shutil

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
ORIGIN='https://neronook.mdcurtis.chatgpt.site/'
TEAM='2GFVXB3249'


def download(path):
    file=HERE/'dist'/path
    return dict(path=path,sha256=hashlib.sha256(file.read_bytes()).hexdigest(),bytes=file.stat().st_size)


def listing(id,name,symbol,tint,category,summary,detail,*,kind='native',capabilities=None,dependencies=None,version='0.1.0',artifact=None):
    return dict(id=id,name=name,version=version,summary=summary,detail=detail,category=category,symbol=symbol,tint=tint,kind=kind,
                publisher=dict(name='NeroNook · Michael Curtis',teamID=TEAM if kind=='native' else None,website=ORIGIN+'guide.html'),
                minimumHost='0.28.1',minimumOS='14.0.0',architectures=['arm64'],capabilities=capabilities or [],dependencies=dependencies or [],
                releaseNotes='Public release qualification is ongoing. This listing describes the current developer preview.' if not artifact else 'First curated library release. Install and update only after reviewing the package.',
                availability='available' if artifact else 'preview',download=download(artifact) if artifact else None)


def main(sequence):
    entries=[
        listing('cafe.nero.plugin.voice','Nero Voice','waveform','A387C5','Work','Dictation, meeting transcripts and a place to return to the conversation.',
                'Hold your chosen shortcut, speak and release to paste into the active app. The meeting workspace brings recordings, transcripts, cited questions and notes together. Apple Speech remains the default where appropriate; separately prepared local MLX models are optional.',version='0.16.3',
                capabilities=['Microphone and optional meeting audio capture','Accessibility for insertion into the active application','Plugin-owned recordings, transcripts and settings']),
        listing('cafe.nero.plugin.agent','Nero Agent','bubble.left.and.bubble.right.fill','D39153','Work','A persistent conversation, with context you choose to share.',
                'A separate chat experience for asking questions, inspecting selected context and proposing actions. Account connections and cloud reasoning belong to this plugin. Proposals and execution remain distinct.',version='0.3.4',capabilities=['Plugin-owned account connection','User-selected context and reviewed actions']),
        listing('cloud.fuego.nook-agent','Fuego Agent','flame.fill','DD7547','Work','Hand off a job. Follow its progress. Keep the result close.',
                'Connect your own Fuego account, review a job handoff and follow progress and cancellation in the Nook. Workflows can wait for jobs to finish. Requires access to a configured Fuego service and worker; NeroNook does not bundle the Fuego runtime.',version='0.4.0',capabilities=['Plugin-owned Fuego sign-in','Reviewed remote jobs, progress, cancellation and results'],
                dependencies=[dict(name='Fuego',detail='Your configured Fuego service and worker.',website='https://neronook.mdcurtis.chatgpt.site/guide.html')]),
        listing('cafe.nero.plugin.bambu','Bambu Monitor','printer.fill','7C9C69','Devices','Your print, filament and toolheads, within reach.',
                'The public Bambu module is an independent integration for supported printers. Device access, telemetry and camera availability depend on your printer configuration. Private experimental variants are not part of this library.',version='1.6.1',capabilities=['Local printer connection with plugin-owned credentials','Printer status and configuration-dependent views']),
        listing('cafe.nero.plugin.streamdeck','Stream Deck','keyboard.fill','887AA9','Devices','Put your Nook workflows on the keys you already use.',
                'Connects through the Elgato Stream Deck application and a companion plugin. Launch reviewed workflows and follow their status on the keys, with a paired Stop action. This integration does not replace Elgato’s application.',version='0.3.0',capabilities=['Local companion connection','Granted workflow launch, live status and cancellation'],dependencies=[dict(name='Elgato Stream Deck',detail='The native Stream Deck app and NeroNook companion are required.',website='https://www.elgato.com/stream-deck')]),
        listing('cafe.nero.plugin.logitech','Logitech','computermouse.fill','7F8E69','Devices','A useful home for your mouse, keyboard and desk workflows.',
                'Connects to OpenLogi’s public interface for supported Logitech hardware. Mouse and keyboard views stay separate from setup. Optional keyboard events can participate in reviewed workflows.',version='0.5.1',capabilities=['OpenLogi public API connection','Supported mouse and keyboard controls','Opt-in keyboard connection and battery events'],dependencies=[dict(name='OpenLogi',detail='A compatible installed OpenLogi app and agent are required.',website='https://neronook.mdcurtis.chatgpt.site/guide.html')]),
        listing('cafe.nero.plugin.ark','Odyssey Ark','display','6498A6','Devices','Samsung monitor controls that belong right on your desk.',
                'Independent local-network controls for supported Samsung Odyssey Ark monitors. Pairing, certificate trust and source mappings belong to the plugin. Optional Logitech source following needs both independent modules and explicit configuration.',version='0.4.0',capabilities=['Local monitor pairing and plugin-owned credentials','Supported monitor volume and source controls']),
        listing('cafe.nero.plugin.weather','Weather Observatory','cloud.sun.fill','BE984F','Home','Forecasts, wind, temperature and a wider view of the weather.',
                'An independent weather module with a location-aware forecast and selectable Earth and optional Windy map views. No separate desktop app is required. Windy requires your own API entitlement; Earth’s viewer availability depends on its service.',version='0.4.0',capabilities=['Optional location permission or manual place selection','Weather-provider network requests','Optional plugin-owned Windy API key']),
        listing('cafe.nero.plugin.applehome','Apple Home','house.and.flag.fill','BD9369','Home','Keep your selected home and its accessories close.',
                'A separate Apple Home integration. Requires a compatible Apple Home setup and the permissions supported by the plugin. Account and accessory availability are checked independently of NeroNook.',version='0.2.1',capabilities=['Apple Home access for your selected home']),
        listing('cafe.nero.plugin.google','Google','calendar','6687BB','Work','Calendar, inbox, tasks and files, with room to work.',
                'A plugin-owned Google account connection with separate views for calendar events, mail, tasks and files. OAuth registration, consent and account coverage remain part of its independent release qualification.',version='0.1.4',capabilities=['User-approved Google OAuth scopes','Calendar, inbox, task and file views'])
    ]
    ha_root=ROOT/'build/distribution/homeassistant-0.2.0-catalog.1'
    receipt_path=ha_root/'release.json'
    available=False
    if receipt_path.exists():
        receipt=json.loads(receipt_path.read_text())
        available=all(receipt.get(key) is True for key in ['notarized','stapled','gatekeeperAccepted']) and receipt.get('phase')=='verified'
        if available:
            source=ha_root/receipt['finalArchive']
            if hashlib.sha256(source.read_bytes()).hexdigest()!=receipt['finalSHA256']:raise ValueError('Home Assistant release receipt mismatch')
            target=HERE/'dist/downloads'/source.name;shutil.copyfile(source,target)
            manifest=json.loads((ha_root/receipt['app']/'Contents/Resources/NookPlugin.json').read_text())
    ha_capabilities=manifest['capabilities'] if available else ['Plugin-owned Home Assistant token','Live home inventory and individually allowed device controls']
    entries.insert(8,listing('cafe.nero.plugin.homeassistant','Home Assistant','house.fill','63A9B7','Home','Favorites, rooms and scenes. Control what you choose.',
        'An independent connection to your Home Assistant server. Start read only, then individually allow lights, switches and scenes. Native and in-Nook controls review their targets; locks, doors, climate and security are read only in this release. No separate desktop application is required.',
        version='0.2.0',capabilities=ha_capabilities,artifact='downloads/'+source.name if available else None,
        dependencies=[dict(name='Home Assistant server',detail='Your own running server and a token you provide in the plugin.',website='https://www.home-assistant.io/')]))
    sample=ROOT/'build/distribution/creator-samples-0.1.8/Creator-0.1.3.app/Contents/Resources/NookPlugin.json'
    manifest=json.loads(sample.read_text())
    entries.append(listing(manifest['id'],manifest['name'],'square.grid.2x2','8D9779','Getting started',manifest['summary'],
        'A synthetic native creator example: a shared counter, inline review, a custom view and an independent window. It does not connect to accounts or devices. Useful for trying installation and learning the SDK.',version=manifest['version'],capabilities=manifest['capabilities'],artifact='downloads/Creator-0.1.3.zip'))
    hello=json.loads((HERE/'dist/downloads/HelloNook.neronookmodule').read_text())
    entries.append(listing(hello['id'],hello['name'],'hand.wave.fill','BD875A','Getting started',hello['summary'],
        'A small, local greeting and counter in the isolated module runner. An easy first install and an editable starting point for lightweight module authors.',kind='lightweight',version=hello['version'],artifact='downloads/HelloNook.neronookmodule'))
    now=datetime.now(timezone.utc).replace(microsecond=0)
    payload=dict(schemaVersion=1,sequence=sequence,publishedAt=now.isoformat().replace('+00:00','Z'),expiresAt=(now+timedelta(days=30)).isoformat().replace('+00:00','Z'),entries=entries)
    (HERE/'catalog-source.json').write_text(json.dumps(payload,indent=2)+'\n')
    print(json.dumps(dict(entries=len(entries),available=sum(e['download'] is not None for e in entries),sequence=sequence)))


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--sequence',type=int,required=True);args=parser.parse_args()
    if args.sequence<1:raise SystemExit('Use a positive, increasing catalog sequence.')
    main(args.sequence)
