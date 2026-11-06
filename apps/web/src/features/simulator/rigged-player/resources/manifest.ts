export const PLAYER_RESOURCE_VERSION = 'quaternius-player-audition-v1';
export const PLAYER_RESOURCE_ROOT = '/assets/player-audition/';

export const PLAYER_RESOURCE_FILES = [
  { path: 'Superhero_Male_FullBody.gltf', bytes: 30989, sha256: 'e7fcea214ecf8855afbf910b50de6f9c7d1decfb71ca28bad8a4481452dafeb4' },
  { path: 'Superhero_Male_FullBody.bin', bytes: 720076, sha256: '459003f9745853ae562a85506a2b94dd56515c1f37728f9fa3d2ce1a3e4cd92f' },
  { path: 'T_Hair_1_Normal_png.png', bytes: 4326126, sha256: '57fd0ad8c96a4d01b38769637e066cecaa285b456f6e48ce00863754a457affb' },
  { path: 'T_Hair_1_BaseColor.png', bytes: 1570376, sha256: 'bc7aa863bd22ab0a995cd838cceb4d3a5186ee54ee2fb0108fad85d20c057e6e' },
  { path: 'T_Eye_Normal_png.png', bytes: 15099, sha256: '9ed61f7726a54fe346a78b9e5a18905d8e2b88f86235d97f53cd207a26f3f8c7' },
  { path: 'T_Eye_Brown.png', bytes: 35958, sha256: 'd08e3356a83211bc6ca21fe3a8e39f4b5c1a3b8f85457fc2c0fb57be09935025' },
  { path: 'T_Superhero_Male_Normal.png', bytes: 4252937, sha256: '9b25cf9200216eb754b79cf4c63b5380c419780788322f3c57cdd2b3e02679a6' },
  { path: 'T_Superhero_Male_Dark.png', bytes: 1389170, sha256: '419f96dbb8811511e2d515bcdabc085ff2f219ec7b8b4e91050a84cba6888fe9' },
  { path: 'T_Superhero_Male_Roughness.png', bytes: 3152049, sha256: 'c70dabf48574cda55644d556beae1ee7cf1bdcf68a50d259d20f2f2358f27991' },
  { path: 'hair/Hair_SimpleParted.gltf', bytes: 2010, sha256: 'ce6c666d00bcca2baa0c58d0442505f90f8feff952592effc4697a2341e9e56d' },
  { path: 'hair/Hair_SimpleParted.bin', bytes: 32032, sha256: '57c6359703a37e346ee38a9c7ba55c8dee761c0a02da99847d06f5a91728f3cc' },
  { path: 'hair/T_Hair_1_Normal.png', bytes: 4326126, sha256: '57fd0ad8c96a4d01b38769637e066cecaa285b456f6e48ce00863754a457affb' },
  { path: 'hair/T_Hair_1_BaseColor.png', bytes: 1570376, sha256: 'bc7aa863bd22ab0a995cd838cceb4d3a5186ee54ee2fb0108fad85d20c057e6e' },
  { path: 'UAL1_Standard.glb', bytes: 7618436, sha256: '69591853d817488edaa8fd9bf8fc1d821eaeaf789f8627b3cd23b41c4ed67997' },
] as const;

export type PlayerResourcePath = (typeof PLAYER_RESOURCE_FILES)[number]['path'];

export const PLAYER_RESOURCE_MANIFEST: readonly Readonly<{ path: string; byteLength: number; sha256: string }>[] =
  Object.freeze(PLAYER_RESOURCE_FILES.map((entry) => Object.freeze({
    path: `${PLAYER_RESOURCE_ROOT}${entry.path}`,
    byteLength: entry.bytes,
    sha256: entry.sha256,
  })));
