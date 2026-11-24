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
import { formatBytes } from '../game/format.ts';
import {
  automate,
  buyDwarf,
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
  levelOf,
  selectedDevice,
  selectedPort,
  underExit,
  type LevelState,
} from '../state/world.ts';

function ChipButton({ chip, need, onClick, label }: { chip: string; need: number; onClick: () => void; label: string }) {
  const have = inventory.value[chip] ?? 0;
  return (
    <button type="button" disabled={have < need} onClick={onClick}>
      {label} ({have}/{need} {chipName(chip)})
    </button>
  );
}

/** Details for the Device whose label was tapped. */
export function DevicePanel({ lvl }: { lvl: LevelState }) {
  const sel = selectedDevice.value;
  if (!sel || sel.depth !== lvl.def.depth) return null;
  const def = lvl.def.devices[sel.device];
  if (!def || lvl.devices.value[sel.device]?.buried) return null;
  const depth = lvl.def.depth;
  const model = getDeviceModel(def.model);
  const level = levelOf(def.model);
  const upgrade = (
    <ChipButton chip={def.model} need={chipsToUpgrade(level)} onClick={() => upgradeDevice(def.model)} label={`Upgrade to L${level + 1}`} />
  );

  if (model.id === FORGE_ID) {
    const price = dwarfPrice(dwarvesBought.value);
    return (
      <div className="panel">
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
      </div>
    );
  }

  const automated = lvl.automated.value.includes(sel.device);
  const buffered = lvl.buffers.value[sel.device] ?? 0;
  return (
    <div className="panel">
      <h3>
        {model.name} · L{level}
      </h3>
      <p className="muted">
        {model.pun} · {formatBytes(deviceRate(model, level))}/s
        {automated ? ' · automated by cron' : ` · holds ${formatBytes(bufferCap(model, level))}`}
      </p>
      <div className="panel-actions">
        {!automated && (
          <button type="button" disabled={buffered < 1} onClick={() => collect(depth, sel.device)}>
            Collect {formatBytes(buffered)}
          </button>
        )}
        {upgrade}
        {!automated && <ChipButton chip={CRON_CHIP} need={1} onClick={() => automate(depth, sel.device)} label="Automate" />}
      </div>
    </div>
  );
}

/** The network port's (or USB port's) panel, opened by tapping its stretch of the top Wall. */
export function PortPanel({ lvl }: { lvl: LevelState }) {
  const depth = lvl.def.depth;
  if (selectedPort.value !== depth) return null;
  const open = !lvl.exit.value.buried;

  if (lvl.def.exit.kind === 'usb') {
    const carrier = dwarves.value.some((d) => d.depth === depth && underExit(lvl.def, d.pos));
    return (
      <div className="panel">
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
      </div>
    );
  }

  const port = lvl.port.value;
  const tech = NETWORK_TECHS[port.tech]!;
  const next = NETWORK_TECHS[port.tech + 1];
  return (
    <div className="panel">
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
    </div>
  );
}
