import { getDeviceModel } from './devices.ts';
import { CRON_CHIP, DUPLEX_CHIP, NETWORK_TECHS } from './network.ts';

/** Display name for any chip id: device models, network technologies, or special chips. */
export function chipName(id: string): string {
  if (id === CRON_CHIP) return 'cron job';
  if (id === DUPLEX_CHIP) return 'Duplex chip';
  const tech = NETWORK_TECHS.find((t) => t.id === id);
  if (tech) return `${tech.name} chip`;
  return `${getDeviceModel(id).name} chip`;
}
