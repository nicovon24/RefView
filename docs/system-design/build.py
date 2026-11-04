"""Regenerate the RefView system diagrams using the diagram-design SVG exporter.

The diagrams intentionally borrow the editorial palette, dimensions and card
grammar of the sibling AI Engineering Projects system-design SVGs. HTML is
created only as a temporary export source; the committed artifacts are SVG.
"""

from __future__ import annotations

import html
import subprocess
import sys
import tempfile
from pathlib import Path


HERE = Path(__file__).resolve().parent
SKILL = Path.home() / ".agents" / "skills" / "diagram-design" / "scripts"
PAPER = "#f7f3ed"
INK = "#2d2824"
MUTED = "#62574f"
CARD = "#fffdf9"
ACCENT = "#f3e0d5"
ACCENT_INK = "#914024"
RULE = "#d0bfb2"


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def path(d: str, slug: str, *, dashed: bool = False) -> str:
    dash = ' stroke-dasharray="5 4"' if dashed else ""
    return (
        f'<path d="{esc(d)}" fill="none" stroke="{MUTED}" '
        f'stroke-width="1.5"{dash} marker-end="url(#{slug}-arrow)"/>'
    )


def card(x: int, y: int, tag: str, name: str, lines: list[str], *, focus: bool = False,
         width: int = 248, height: int = 112) -> str:
    fill, stroke = (ACCENT, ACCENT_INK) if focus else (CARD, MUTED)
    parts = [f'<g><rect x="{x}" y="{y}" width="{width}" height="{height}" '
             f'rx="8" fill="{fill}" stroke="{stroke}"/>',
             f'<text x="{x+20}" y="{y+25}" class="tag" '
             f'fill="{stroke}">{esc(tag)}</text>',
             f'<text x="{x+20}" y="{y+54}" class="name">{esc(name)}</text>']
    for index, line in enumerate(lines):
        parts.append(f'<text x="{x+20}" y="{y+78+index*20}" '
                     f'class="sub">{esc(line)}</text>')
    return "".join(parts) + "</g>"


def diagram(slug: str, title: str, description: str, edges: list[str],
            nodes: list[str], footer: list[str], extra: str = "") -> str:
    root = f"{slug}-root"
    body = "".join(edges + nodes)
    footer_svg = [f'<line x1="48" y1="640" x2="1232" y2="640" stroke="{RULE}"/>']
    footer_svg += [f'<text x="48" y="{669+i*24}" class="sub">{esc(line)}</text>'
                   for i, line in enumerate(footer)]
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" role="img" aria-labelledby="{slug}-title {slug}-desc" id="{root}" font-family="Arial, system-ui, sans-serif">
<title id="{slug}-title">{esc(title)}</title><desc id="{slug}-desc">{esc(description)}</desc>
<defs><style>
#{root} text {{ fill:{INK}; font-family:Arial,system-ui,sans-serif; }}
#{root} .name {{ font-size:22px; font-weight:600; }}
#{root} .sub {{ font-size:17px; fill:{MUTED}; }}
#{root} .tag {{ font-size:14px; letter-spacing:.05em; fill:{MUTED}; }}
</style><marker id="{slug}-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="{MUTED}"/></marker></defs>
<rect width="1280" height="720" fill="{PAPER}"/><text x="48" y="72" class="name">{esc(title)}</text>
{extra}{body}{''.join(footer_svg)}
</svg>'''
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title><style>html,body{{margin:0;background:{PAPER};color:{INK};font-family:Arial,system-ui,sans-serif}}.diagram-container{{width:100%;overflow-x:auto}}svg{{width:100%;min-width:1280px;display:block}}@media print{{.diagram-container{{overflow-x:visible}}svg{{min-width:0}}}}</style></head><body><main><h1 style="position:absolute;left:-9999px">{esc(title)}</h1><div class="diagram-container">{svg}</div></main></body></html>'''


def architecture() -> str:
    slug = "refview-architecture"
    xs = [48, 352, 656, 960]
    edges = [path(f"M {xs[i]+248} 168 H {xs[i+1]}", slug) for i in range(3)]
    edges += [path("M 1084 224 V 360", slug)]
    edges += [path(f"M {xs[i]} 416 H {xs[i-1]+248}", slug) for i in (3, 2, 1)]
    # Server-owned supporting paths: private evaluation input, pinned restore,
    # and replay. None grants the browser or Coach direct database/private access.
    edges += [path("M 476 112 V 88 H 1224 V 416 H 1208", slug, dashed=True),
              path("M 904 388 H 928 V 196 H 960", slug, dashed=True),
              path("M 600 444 H 628 V 196 H 656", slug, dashed=True)]
    nodes = [
        card(48, 112, "AUTHORING", "Scenario source", ["Facts, tracks, sources", "Private evidence + rubric"], focus=True),
        card(352, 112, "LOCAL / SERVER", "Compile + project", ["Validate and hash v2", "Public / private views"]),
        card(656, 112, "BROWSER", "3D simulator", ["Exact tick + cameras", "Local route unsaved"], focus=True),
        card(960, 112, "PLANNED WIRING", "Attempt operations", ["Owner-bound session", "Decision + recovery"]),
        card(960, 360, "DOMAIN", "Evaluation", ["Deterministic facts", "No AI scoring"]),
        card(656, 360, "SERVER / DB", "Prisma + Postgres", ["Versions and attempts", "Integrated flow pending"]),
        card(352, 360, "PLANNED WIRING", "Debrief + replay", ["Prepared explanation", "Canonical timeline"]),
        card(48, 360, "OPTIONAL", "AI Coach", ["Explain evaluated attempt", "Cannot change score"]),
    ]
    return diagram(slug, "RefView system architecture",
                   "Authored scenarios compile into public and private projections; the browser renders a canonical timeline, while owner-bound attempts, deterministic evaluation, persistence, debrief, replay and optional AI explanation form the planned integrated journey.",
                   edges, nodes,
                   ["Solid: intended main journey. Dashed: server-owned projection, restore or replay.",
                    "Current 3D routes are local, unsaved and unscored; reviewed publication and integrated attempts remain open."])


def scene() -> str:
    slug = "scene-assembly-3d"
    widths = 216
    xs = [48, 290, 532, 774, 1016]
    centers = [x + widths // 2 for x in xs]
    edges = [path("M 640 216 V 248", slug), path("M 640 336 V 368", slug),
             f'<path d="M 156 368 H 1124" fill="none" stroke="{MUTED}" stroke-width="1.5"/>']
    edges += [path(f"M {cx} 368 V 400", slug) for cx in centers]
    nodes = [card(472, 112, "R3F MOUNT", "Canvas", ["React owns mount + lifecycle"], focus=True,
                  width=336, height=104),
             card(472, 248, "THREE RUNTIME", "THREE.Scene", ["Imperative scene objects"], width=336, height=88),
             card(xs[0], 400, "ENVIRONMENT", "Field + stadium", ["Pitch, goals, crowd", "Lighting + shadows"], width=widths),
             card(xs[1], 400, "ACTORS", "Players x7", ["Independent actor roots", "Cloned skinned rigs"], width=widths),
             card(xs[2], 400, "CONTROLLED", "Referee", ["Canonical root + visual", "Black kit, Idle / Walk / Jog"], focus=True, width=widths),
             card(xs[3], 400, "TRACKED", "Ball", ["Own canonical transform", "Authored event track"], width=widths),
             card(xs[4], 400, "VIEW", "Camera", ["First / third person", "Built from view sample"], width=widths)]
    return diagram(slug, "Three.js scene hierarchy",
                   "React Three Fiber mounts a Three.js scene with separate environment, seven player actors, referee, ball and camera branches. Canonical ticks provide transforms and motion samples.",
                   edges, nodes,
                   ["Each canonical tick updates actor roots, referee pose, ball and camera before rendering.",
                    "Detailed environment, player-rig and render-flow views are shown in companion diagrams."])


def environment() -> str:
    slug = "environment-structure"
    centers = [156, 398, 640, 882, 1124]
    edges = [path("M 640 216 V 256", slug), path("M 640 344 V 376", slug),
             f'<path d="M 172 376 H 1140" fill="none" stroke="{MUTED}" stroke-width="1.5"/>']
    edges += [path(f"M {cx} 376 V 408", slug) for cx in [172, 414, 656, 898, 1140]]
    nodes = [card(472, 112, "SCENE BRANCH", "Environment", ["Shared pitch + stadium"], focus=True, width=336, height=104),
             card(472, 256, "GROUP", "Field environment", ["Composed from local Three meshes"], width=336, height=88),
             card(48, 408, "GROUND", "Pitch", ["Grass material", "Color / normal / roughness"], width=216),
             card(290, 408, "MARKINGS", "Lines + goals", ["Regulation markings", "Goals + nets"], width=216),
             card(532, 408, "STRUCTURE", "Stadium", ["Stepped stands", "Closed corners"], width=216),
             card(774, 408, "REPEATED", "Crowd", ["Instanced figures", "Low-cost repetition"], width=216),
             card(1016, 408, "LIGHT", "Sky + shadows", ["Daylight and fill", "Contact grounding"], width=216)]
    return diagram(slug, "Pitch and stadium structure",
                   "The environment branch groups a textured pitch and markings with goals, stadium stands, an instanced crowd and daylight lighting with shadows.",
                   edges, nodes,
                   ["These are presentation groups; authored timeline tracks own football events.",
                    "Instancing repeats crowd geometry within the shared environment branch."])


def player_rig() -> str:
    slug = "footballer-rig"
    limb_centers = [256, 640, 1024]
    edges = [path("M 640 192 V 220", slug),
             f'<path d="M 432 220 H 848" fill="none" stroke="{MUTED}" stroke-width="1.5"/>',
             path("M 432 220 V 252", slug), path("M 848 220 V 252", slug),
             path("M 432 336 V 352", slug), path("M 432 432 V 460", slug),
             f'<path d="M 256 460 H 1024" fill="none" stroke="{MUTED}" stroke-width="1.5"/>']
    edges += [path(f"M {cx} 460 V 492", slug) for cx in limb_centers]
    nodes = [card(472, 104, "PER ACTOR", "Actor root: THREE.Group", ["Cloned glTF group; canonical transform"], focus=True, width=336, height=88),
             card(300, 252, "SKELETON", "Skeleton root", ["Independent bone hierarchy"], width=264, height=84),
             card(716, 252, "SKINNED SURFACES", "Body + kit shells", ["Generated shirt / shorts / boots"], width=264, height=84),
             card(300, 352, "BONE HIERARCHY", "Pelvis", ["Parent for torso + limbs"], width=264, height=80),
             card(112, 492, "TORSO CHAIN", "Torso + head", ["Spine, chest, neck", "Head: eyes, brows + hair"], width=288),
             card(496, 492, "ARM CHAINS", "Left + right arms", ["Shoulder > elbow > wrist"], width=288),
             card(880, 492, "LEG CHAINS", "Left + right legs", ["Thigh > calf > foot > toes"], width=288)]
    return diagram(slug, "Footballer rig and render hierarchy",
                   "Each player uses a cloned glTF group as its canonical actor root. Its skeleton branch contains pelvis, torso and limb bones; skinned body and generated kit shells are sibling surfaces bound to that skeleton.",
                   edges, nodes,
                   ["Each actor clones its skeleton and materials so pose and kit changes stay per player.",
                    "Shirt, shorts and boots are generated skinned shells over the source body mesh."])


def sequence() -> str:
    slug = "canonical-render-sequence"
    xs = [144, 392, 640, 888, 1136]
    labels = ["TIMELINE", "CONTROLLER", "LOCOMOTION", "EXACT SCENE", "THREE / WEBGL"]
    names = ["Canonical world", "Local controller", "Motion reducer", "Scene adapter", "Three + WebGL"]
    edges: list[str] = []
    nodes: list[str] = []
    for x, label, name in zip(xs, labels, names):
        edges.append(f'<line x1="{x}" y1="196" x2="{x}" y2="596" stroke="{RULE}" stroke-width="1.2" stroke-dasharray="4 4"/>')
        nodes.append(f'<g><rect x="{x-108}" y="112" width="216" height="84" rx="8" fill="{CARD}" stroke="{MUTED}"/><text x="{x-88}" y="137" class="tag">{esc(label)}</text><text x="{x-88}" y="166" class="name">{esc(name)}</text></g>')
    for x, y1, y2 in [(392, 224, 608), (640, 340, 400), (888, 460, 588), (1136, 520, 588)]:
        edges.append(f'<rect x="{x-4}" y="{y1}" width="8" height="{y2-y1}" fill="{ACCENT}" stroke="{ACCENT_INK}" stroke-width="0.8"/>')
    def message(x1: int, x2: int, y: int, label: str, *, returned: bool = False, focus: bool = False) -> str:
        color = ACCENT_INK if focus else MUTED
        dash = ' stroke-dasharray="5 4"' if returned else ""
        marker = f"{slug}-arrow"
        return (f'<path d="M {x1} {y} H {x2}" fill="none" stroke="{color}" stroke-width="1.6"{dash} marker-end="url(#{marker})"/>'
                f'<text x="{(x1+x2)/2}" y="{y-9}" class="sub" text-anchor="middle">{esc(label)}</text>')
    nodes += ['<path d="M 392 260 H 448 V 284 H 392" fill="none" stroke="' + MUTED + '" stroke-width="1.6" marker-end="url(#' + slug + '-arrow)"/>',
              f'<text x="492" y="276" class="sub" text-anchor="middle">integrate referee + camera</text>',
              message(144, 392, 240, "world state at tick t"),
              message(392, 640, 340, "distance + heading per crossed tick"),
              message(640, 392, 400, "Idle / Walk / Jog + stride phase", returned=True),
              message(392, 888, 460, "immutable LocalRenderFrame", focus=True),
              message(888, 1136, 520, "apply actor roots + absolute pose"),
              message(888, 1136, 576, "apply ball + referee + camera; render")]
    return diagram(slug, "Canonical tick to WebGL frame",
                   "For every crossed canonical 60 hertz tick, the controller integrates referee view motion and distance, derives referee gait, freezes one render frame, and the exact scene applies actors, ball, referee and camera before WebGL rendering.",
                   edges, nodes,
                   ["Tick and pose do not depend on browser frame rate; direct sampling reproduces the same skeleton pose.",
                    "Animation and camera present the authored world; they do not alter incident facts or evaluation."])


def pose_pipeline() -> str:
    slug = "rigged-pose-pipeline"
    xs = [48, 352, 656, 960]
    edges = [path(f"M {xs[i]+248} 224 H {xs[i+1]}", slug) for i in range(3)]
    edges += [path("M 1084 280 V 368", slug),
              path("M 960 424 H 904", slug),
              path("M 656 424 H 600", slug)]
    nodes = [card(48, 168, "CANONICAL", "Actor track", ["Root position + yaw", "Clip handle + phase"], width=248),
             card(352, 168, "DISTANCE-DRIVEN", "Build gait plan", ["Per-actor travel", "Idle / Walk / Jog weights"], focus=True, width=248),
             card(656, 168, "DETERMINISTIC", "Restore bind pose", ["Reset bones + root", "Sample at canonical tick"], width=248),
             card(960, 168, "ANIMATION", "Blend clips", ["Stride phase + weights", "Absolute clip times"], width=248),
             card(960, 368, "INCIDENT DETAIL", "Apply corrections", ["Contact IK + defender", "Authored fall pose"], focus=True, width=248),
             card(656, 368, "POSE OUTPUT", "Apply skeleton", ["Root + bone transforms", "Player-specific instance"], width=248),
             card(352, 368, "PRESENTATION", "Exact scene render", ["Ball, referee, camera", "WebGL frame"], width=248)]
    return diagram(slug, "How a canonical player pose is built",
                   "Canonical actor tracks determine root and clip phase. A distance-driven gait plan supplies Idle, Walk and Jog weights; the sampler restores bind transforms, samples clips at exact times, applies contact or fall corrections, and submits the pose to the scene renderer.",
                   edges, nodes,
                   ["The same tick reconstructs the same actor root and skeleton pose, regardless of render frame rate.",
                    "Corrections change presentation only; authored contact, ball track and evaluation remain canonical."])


def workflow() -> str:
    slug = "blender-refview-workflow"
    xs = [48, 352, 656, 960]
    edges = [path(f"M {xs[i]+248} 168 H {xs[i+1]}", slug) for i in range(3)]
    edges += [path("M 1084 224 V 360", slug),
              path("M 960 416 H 904", slug),
              path("M 656 416 H 600", slug)]
    nodes = [
        card(48, 112, "HUMAN", "Football brief", ["Facts + evidence goal", "Reviewed camera views"], focus=True),
        card(352, 112, "PROPOSED", "Blender clips", ["Footwork and fall", "Rig-compatible edits"]),
        card(656, 112, "FORMAT", "glTF / GLB", ["Meshes + skeleton", "Animation data"]),
        card(960, 112, "REQUIRED GATE", "Asset validation", ["License + hash", "Scale, clips, bounds"]),
        card(960, 360, "CURRENT + PLANNED", "RefView authoring", ["Code now; visual editor", "planned for placement"]),
        card(656, 360, "DETERMINISTIC", "Compile + run", ["Source versions", "Exact 60 Hz replay"], focus=True),
        card(352, 360, "OPEN GATE", "Review + publish", ["Contact readability", "Evidence + build binding"]),
    ]
    return diagram(slug, "Proposed Blender to RefView workflow",
                   "A reviewed football brief guides proposed Blender clip work; glTF assets pass provenance and technical validation before RefView authoring, deterministic compilation and visual evidence review permit publication.",
                   edges, nodes,
                   ["Blender and the visual editor are proposed workflow additions; current authoring is code-based.",
                    "Current assets include glTF plus procedural modules; training publication is still open."])


def main() -> None:
    if not (SKILL / "self_check.py").is_file() or not (SKILL / "export_svg.py").is_file():
        raise SystemExit(f"diagram-design helpers unavailable at {SKILL}")
    for name, content in (("system-architecture", architecture()),
                          ("simulator-scene-hierarchy", scene()),
                          ("pitch-stadium-hierarchy", environment()),
                          ("footballer-rig-hierarchy", player_rig()),
                          ("canonical-tick-render-sequence", sequence()),
                          ("rigged-pose-pipeline", pose_pipeline()),
                          ("asset-authoring-pipeline", workflow())):
        with tempfile.TemporaryDirectory(prefix="refview-diagram-") as temp:
            source = Path(temp) / f"{name}.html"
            source.write_text(content, encoding="utf-8")
            subprocess.run([sys.executable, str(SKILL / "self_check.py"), str(source)], check=True)
            subprocess.run([sys.executable, str(SKILL / "export_svg.py"), "--system-fonts",
                            str(source), str(HERE / f"{name}.svg")], check=True)
        print(f"generated {name}.svg")


if __name__ == "__main__":
    main()
