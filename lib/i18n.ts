/**
 * Locales.
 *
 * Indonesian is the default and English is second, because the first user is
 * a curious Indonesian reader on a phone. Toraja terms are the names of the
 * parts in both locales: they are vocabulary, not flavour, so they are never
 * translated away.
 */

export const LOCALES = ['id', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'id'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export const LOCALE_NAMES: Record<Locale, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
}

export const ROUTES = ['bangun', 'rakit', 'baca', 'sumber'] as const
export type Route = (typeof ROUTES)[number]

export function href(locale: Locale, route: Route): string {
  return `/${locale}/${route}`
}

type Dict = Record<Locale, string>

const t = (id: string, en: string): Dict => ({ id, en })

export const COPY = {
  appName: t('Tongkonan', 'Tongkonan'),
  tagline: t(
    'Rumah yang dihitung dari aturannya, bukan digambar.',
    'A house generated from its rules, not drawn.',
  ),

  nav: {
    bangun: t('Bangun', 'Generate'),
    rakit: t('Rakit', 'Assemble'),
    baca: t('Baca', 'Read'),
    sumber: t('Sumber', 'Sources'),
  } satisfies Record<Route, Dict>,

  navGloss: {
    bangun: t('Aturan menjadi bangunan.', 'Rules become a building.'),
    rakit: t('Urutan pendirian dan sambungannya.', 'The build order and its joints.'),
    baca: t('Apa yang bisa dibaca dari muka rumah.', 'What the façade can be read for.'),
    sumber: t('Setiap ukuran dan asalnya.', 'Every dimension and where it came from.'),
  } satisfies Record<Route, Dict>,

  controls: {
    heading: t('Aturan', 'Rules'),
    rank: t('Pangkat', 'Rank'),
    bays: t('Ruang', 'Bays'),
    horns: t('Tanduk', 'Horns'),
    hornsUnit: t('upacara', 'funerals'),
    sun: t('Matahari', 'Sun'),
    time: t('Waktu', 'Time'),
    date: t('Tanggal', 'Date'),
    figure: t('Sosok skala 1,68 m', 'Scale figure, 1.68 m'),
    rain: t('Hujan', 'Rain'),
    unusual: t(
      'Jumlah ruang ini melampaui yang lazim untuk pangkat tersebut.',
      'This bay count exceeds what the rank customarily reaches.',
    ),
  },

  orientation: {
    heading: t('Arah hadap', 'Orientation'),
    body: t(
      'Rumah membujur utara–selatan, muka (ulunna banua) menghadap utara. Arah ini aturan, bukan pilihan, jadi tidak ada kendali untuk memutar bangunan. Yang bisa diputar hanyalah kamera.',
      'The house lies north–south with the front, ulunna banua, facing north. That is a rule, not a choice, so there is no control that turns the building. Only the camera rotates.',
    ),
  },

  provenance: {
    heading: t('Asal ukuran', 'Provenance'),
    measured: t('Terukur', 'Measured'),
    canon: t('Kanon', 'Canon'),
    interpolated: t('Perkiraan penulis', 'Interpolated'),
    measuredGloss: t(
      'Diambil dari gambar ukur rumah yang disurvei dan disebut namanya.',
      'Taken from a measured drawing of a named, surveyed house.',
    ),
    canonGloss: t(
      'Dinyatakan dalam kanon atau uraian etnografi, tetapi tidak diukur.',
      'Stated in a documented canon or ethnographic description, not measured.',
    ),
    interpolatedGloss: t(
      'Nilai penulis sendiri, menutup celah yang ditinggalkan sumber.',
      "The author's own value, closing a gap the sources leave open.",
    ),
    line: t(
      'Bilah ini bergerak ketika survei nyata dimasukkan. Pergerakannya adalah ukuran kemajuan proyek ini.',
      "This bar moves as real surveys are wired in. That movement is the project's progress metric.",
    ),
    renderWarning: t(
      'Gambar tiga dimensi yang mulus menyiratkan ketelitian yang tidak dimiliki sumbernya. Bilah ini yang menjaga keduanya jujur.',
      'A smooth 3D render implies a precision the sources do not have. This bar is what keeps the two honest.',
    ),
  },

  scale: t('Skala', 'Scale'),
  legend: t('Keterangan', 'Legend'),

  views: {
    perspektif: t('Perspektif', 'Perspective'),
    tampak: t('Tampak muka', 'Elevation'),
    kolong: t('Kolong', 'Underfloor'),
  },

  zones: {
    heading: t('Tiga tingkat', 'The three zones'),
    sulluk: t('sulluk banua', 'sulluk banua'),
    sullukGloss: t(
      'Kolong. Dunia bawah: ternak, kayu bakar, dan bayang-bayang dalam yang membuat badan rumah tampak melayang.',
      'The underfloor. The lower world: livestock, firewood, and the deep shadow that makes the body appear to float.',
    ),
    kale: t('kale banua', 'kale banua'),
    kaleGloss: t(
      'Lantai hunian. Dunia tengah: tempat manusia tinggal, dibagi menjadi ruang-ruang bernama.',
      'The living floor. The middle world: where people live, divided into named bays.',
    ),
    rattiang: t('rattiang banua', 'rattiang banua'),
    rattiangGloss: t(
      'Loteng di bawah atap. Dunia atas: penyimpanan padi dan pusaka.',
      'The attic under the roof. The upper world: rice and heirlooms are kept here.',
    ),
  },

  read: {
    heading: t('Yang bisa dibaca', 'What can be read'),
    intro: t(
      'Rumah ini menyatakan dirinya kepada siapa pun yang berjalan mendekat. Tidak satu pun dari keterangan berikut tertulis; semuanya terbaca dari bentuk.',
      'The house states itself to anyone walking up to it. None of the following is written down; all of it is read off the form.',
    ),
    hornsTitle: t('Berapa kali rumah ini berduka', 'How many times this house has mourned'),
    hornsBody: t(
      'Hitung tanduk pada tulak somba. Tiap satu adalah satu upacara rambu solo yang pernah digelar keluarga ini — catatan, bukan hiasan.',
      'Count the horns on the tulak somba. Each one is a funeral this family has held — a record, not an ornament.',
    ),
    rankTitle: t('Kedudukan keluarga', 'Where the family stands'),
    rankBody: t(
      'Skala badan rumah dan seberapa jauh ukiran diizinkan menutup bidangnya. Pangkat tidak diumumkan; ia terlihat dari ukuran dan hak menghias.',
      'The scale of the body, and how far carving is permitted to cover it. Rank is not announced; it is visible in size and in the right to decorate.',
    ),
    baysTitle: t('Berapa ruang di dalamnya', 'How many rooms are inside'),
    baysBody: t(
      'Hitung baris tiang di kolong. Tiap ruang menambah satu baris, jadi pembagian di dalam bisa dibaca dari luar tanpa masuk.',
      'Count the post rows in the underfloor. Each bay adds one, so the division inside can be read from outside without entering.',
    ),
    facingTitle: t('Mana muka rumah', 'Which way the house faces'),
    facingBody: t(
      'Haluan yang lebih tinggi adalah muka, dan muka selalu menghadap utara. Sekali diketahui, satu rumah cukup untuk menentukan arah seluruh halaman.',
      'The higher prow is the front, and the front always faces north. Once that is known, one house is enough to orient the whole courtyard.',
    ),
    carvingTitle: t('Di mana ukiran diletakkan', 'Where the carving goes'),
    carvingBody: t(
      'Pa\u2019ssura menutup papan muka, bukan seluruh rumah. Yang digambar di sini hanya motif yang jelas-jelas geometris; motif yang penggunaannya terbatas tidak dirender.',
      'Pa\u2019ssura covers the front board, not the whole house. Only the plainly geometric motifs are drawn here; motifs whose use is restricted are not rendered.',
    ),
    facade: t('Muka', 'Façade'),
    section: t('Potongan', 'Section'),
    sectionGloss: t(
      'Rumah dipotong pada bidang punggung. Ketiga tingkat itu fakta ruang, bukan diagram.',
      'The house is cut on the ridge plane. The three zones are a spatial fact, not a diagram.',
    ),
  },

  assembly: {
    heading: t('Urutan pendirian', 'Build order'),
    play: t('Jalankan', 'Play'),
    pause: t('Jeda', 'Pause'),
    replay: t('Ulangi', 'Replay'),
    reducedMotion: t(
      'Gerak dikurangi: urutan tetap ditampilkan, tetapi langsung dan berurutan tanpa animasi.',
      'Reduced motion: the sequence is still shown, as an immediate ordered reveal.',
    ),
    noNails: t(
      'Rangka disusun tanpa paku. Setiap sambungan pada model ini diuji: pen harus berada di dalam lubangnya.',
      'The frame goes up without nails. Every joint in this model is tested: the tenon has to sit inside its mortise.',
    ),
  },

  joints: {
    heading: t('Sambungan', 'Joints'),
    pasak: t('Pasak', 'Pegged mortise and tenon'),
    pasakGloss: t(
      'Pen masuk ke lubang, lalu dikunci pasak kayu yang menembus keduanya. Inilah sambungan utama rangka.',
      'A tenon enters a mortise and a wooden peg driven through both locks it. This is the frame’s main joint.',
    ),
    takik: t('Takik', 'Lap'),
    takikGloss: t(
      'Dua balok bersilang saling ditakik agar rata dan tidak bergeser.',
      'Two crossing members are each notched so they sit flush and cannot shift.',
    ),
    tumpu: t('Tumpu', 'Seat'),
    tumpuGloss: t(
      'Kaki tiang duduk di cekungan batu umpak. Tidak ditanam — karena itulah rumah bisa dibongkar dan dipindah.',
      'A post foot seats in the dish of its pad stone. It is not buried — which is why the house can be taken down and moved.',
    ),
    explode: t('Urai', 'Explode'),
    explodeGloss: t(
      'Mengangkat tiap bagian sesuai urutan pendiriannya, agar sambungan di bawahnya terlihat.',
      'Lifts each part by its place in the build order, so the joints beneath it can be seen.',
    ),
  },

  checks: {
    heading: t('Pemeriksaan', 'Invariants'),
    pass: t('lulus', 'pass'),
    fail: t('gagal', 'fail'),
    skip: t('dilewati', 'skipped'),
    line: t(
      'Belum ada gambar ukur, jadi ketepatan bertumpu pada kebenaran struktural. Pemeriksaan ini menggagalkan build.',
      'There is no measured drawing yet, so correctness rests on structural truth. These checks fail the build.',
    ),
  },

  sources: {
    heading: t('Sumber', 'Sources'),
    dimension: t('Ukuran', 'Dimension'),
    value: t('Nilai', 'Value'),
    klass: t('Kelas', 'Class'),
    citation: t('Kutipan', 'Citation'),
    note: t('Keterangan', 'What it means'),
    none: t('Tidak ada sumber', 'No source'),
  },
} as const

export function pick(dict: Dict, locale: Locale): string {
  return dict[locale]
}
