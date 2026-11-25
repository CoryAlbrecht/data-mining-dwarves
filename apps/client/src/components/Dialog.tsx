import {
  bufferCap,
  chipName,
  chipsToUpgrade,
  CRON_CHIP,
  deviceRate,
  DUPLEX_CHIP,
  dwarfPrice,
  FORGE_ID,
  getDeviceModel,
  NETWORK_TECHS,
  portCapacity,
  portSpeed,
} from '@dmd/shared';
import type { MouseEvent, ReactNode } from 'react';
import { formatBytes } from '../game/format.ts';
import {
  automate,
  buyDwarf,
  closeDialog,
  collect,
  installDuplex,
  sneakernet,
  upgradeDevice,
  upgradePort,
  upgradePortTech,
} from '../state/actions.ts';
import {
  bytes,
  dwarves,
  dwarvesBought,
  inventory,
  levelAt,
  levelOf,
  dialogSubject,
  underExit,
  type LevelState,
} from '../state/world.ts';
import { themeVars } from './theme.ts';

function ChipButton({ chip, need, onClick, label }: { chip: string; need: number; onClick: () => void; label: string }) {
  const have = inventory.value[chip] ?? 0;
  return (
    <button type="button" disabled={have < need} onClick={onClick}>
      {label} ({have}/{need} {chipName(chip)})
    </button>
  );
}

/** Details for the Device whose label was tapped. */
function DeviceDetails({ lvl, device }: { lvl: LevelState; device: number }) {
  const def = lvl.def.devices[device];
  if (!def || lvl.devices.value[device]?.buried) return null;
  const depth = lvl.def.depth;
  const model = getDeviceModel(def.model);
  const level = levelOf(def.model);
  const upgrade = (
    <ChipButton chip={def.model} need={chipsToUpgrade(level)} onClick={() => upgradeDevice(def.model)} label={`Upgrade to L${level + 1}`} />
  );

  if (model.id === FORGE_ID) {
    const price = dwarfPrice(dwarvesBought.value);
    return (
      <>
        <h3>
          {model.name} · L{level}
        </h3>
        <p className="muted">{model.pun} New dwarves come out at L{level}, next to the Entry.</p>
        <div className="panel-actions">
          <button type="button" disabled={bytes.value < price} onClick={() => buyDwarf(depth)}>
            Spawn L{level} dwarf ({formatBytes(price)})
          </button>
          {upgrade}
        </div>
      </>
    );
  }

  const automated = lvl.automated.value.includes(device);
  const buffered = lvl.buffers.value[device] ?? 0;
  return (
    <>
      <h3>
        {model.name} · L{level}
      </h3>
      <p className="muted">
        {model.pun} · {formatBytes(deviceRate(model, level))}/s
        {automated ? ' · automated by cron' : ` · holds ${formatBytes(bufferCap(model, level))}`}
      </p>
      <div className="panel-actions">
        {!automated && (
          <button type="button" disabled={buffered < 1} onClick={() => collect(depth, device)}>
            Collect {formatBytes(buffered)}
          </button>
        )}
        {upgrade}
        {!automated && <ChipButton chip={CRON_CHIP} need={1} onClick={() => automate(depth, device)} label="Automate" />}
      </div>
    </>
  );
}

/** The Network port's (or USB port's) details, opened by tapping its stretch of the top Wall. */
function PortDetails({ lvl }: { lvl: LevelState }) {
  const depth = lvl.def.depth;
  const open = !lvl.exit.value.buried;

  if (lvl.def.exit.kind === 'usb') {
    const carrier = dwarves.value.some((d) => d.depth === depth && underExit(lvl.def, d.pos));
    return (
      <>
        <h3>USB port: sneakernet</h3>
        <p className="muted">
          Copy everything onto a USB stick and walk it over to computer {lvl.def.computer + 2}. You keep your bytes,
          chips and Device Levels. <strong>This computer and all its dwarves are left behind for good</strong>, and you
          start over with one L1 dwarf.
        </p>
        <div className="panel-actions">
          <button type="button" disabled={!open || !carrier} onClick={() => void sneakernet(depth)}>
            {!open
              ? 'Dig through to the USB port first'
              : carrier
                ? `Sneakernet to computer ${lvl.def.computer + 2}`
                : 'Walk a dwarf under the USB port first'}
          </button>
        </div>
      </>
    );
  }

  const port = lvl.port.value;
  const tech = NETWORK_TECHS[port.tech]!;
  const next = NETWORK_TECHS[port.tech + 1];
  return (
    <>
      <h3>
        {tech.name} · L{port.level} · {portSpeed(port)}
      </h3>
      <p className="muted">
        {open ? 'Open' : 'Still buried'} · through: {port.passed}/{portCapacity(port.level)} dwarves · carries up to L
        {tech.maxDwarfLevel} · {port.duplex ? 'full duplex ⇅' : 'half duplex ⇡'}
      </p>
      <div className="panel-actions">
        <ChipButton chip={tech.id} need={chipsToUpgrade(port.level)} onClick={() => upgradePort(depth)} label="Upgrade" />
        {next && (
          <ChipButton chip={next.id} need={chipsToUpgrade(1)} onClick={() => upgradePortTech(depth)} label={`Rewire as ${next.name} (back to L1)`} />
        )}
        {!port.duplex && <ChipButton chip={DUPLEX_CHIP} need={1} onClick={() => installDuplex(depth)} label="Install duplex" />}
      </div>
      <p className="muted">Walk a dwarf up into the open port to send it to Mine {depth + 1}.</p>
    </>
  );
}

/** Close when the dimmed backdrop (the <dialog> itself, outside its card) is clicked. */
function closeOnBackdrop(e: MouseEvent<HTMLDialogElement>) {
  if (e.target === e.currentTarget) closeDialog();
}

/**
 * The one dialog over the page: a Device's or port's details, opened by tapping it. Modal, so the
 * Mine behind is dimmed and can't be tapped, but the game keeps running. It wears the Theme of
 * the Mine it was opened from. Escape, ✕ or a backdrop tap closes it.
 */
export function GameDialog() {
  const subject = dialogSubject.value;
  const lvl = subject && levelAt(subject.depth);
  if (!subject || !lvl) return null;
  let body: ReactNode;
  if (subject.kind === 'port') body = <PortDetails lvl={lvl} />;
  else body = <DeviceDetails lvl={lvl} device={subject.device} />;
  const { theme } = lvl.def;
  return (
    <dialog
      // Opened as a modal as soon as it mounts; unmounting (dialogSubject cleared) removes it.
      ref={(el) => {
        if (el && !el.open) el.showModal();
      }}
      className={`game-dialog theme-${theme.style}`}
      style={themeVars(theme)}
      aria-label={subject.kind === 'port' ? 'Port details' : 'Device details'}
      onCancel={(e) => {
        e.preventDefault(); // Escape: let the game close it, so state and screen agree
        closeDialog();
      }}
      onClick={closeOnBackdrop}
    >
      <div className="panel">
        <button type="button" className="dialog-close" aria-label="Close" onClick={closeDialog}>
          ✕
        </button>
        {body}
      </div>
    </dialog>
  );
}
