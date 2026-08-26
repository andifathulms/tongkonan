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
  /**
   * The thesis, said once where the model is.
   *
   * On a phone the rail sits below the viewport, so every word explaining the
   * project is off-screen on arrival. Without this the first screen is a
   * handsome model and no argument, which is the opposite of the point.
   */
  thesis: t(
    'Ubah pangkat, jumlah ruang, atau jumlah tanduk — rumah dihitung ulang dari aturan itu.',
    'Change the rank, the bay count, or the horns — the house is recomputed from those rules.',
  ),
  hint: t('Seret untuk memutar · gulir untuk mendekat', 'Drag to rotate · scroll to zoom'),
  computed: t('Dihitung dari aturan', 'Computed from the rules'),
  modelLabel: t(
    'Model tongkonan, dihitung dari aturannya',
    'Tongkonan model, generated from its rules',
  ),
  openIn: t('Buka dalam Bahasa Indonesia', 'Open in English'),

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
    /*
     * Spoken values for the sliders. A range announces its raw number, so
     * without these the time control says "720" where the screen says 12:00,
     * and the assembly scrubber says "500", which names nothing at all.
     */
    timeValue: t('{clock} WITA, matahari {alt}° di atas ufuk', '{clock} WITA, sun {alt}° above the horizon'),
    hornsValue: t('{n} upacara', '{n} funerals'),
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
    mark: t('Tandai model', 'Mark the model'),
    markHint: t(
      'Mewarnai tiap bagian menurut asal ukuran yang membentuknya, bukan menurut bahannya. Tiap bagian dinilai dari sumbernya yang paling lemah.',
      "Colours each part by where its dimensions came from rather than by what it is made of. A part is classed by its least-sourced input.",
    ),
    /**
     * Said with the counts rather than in the abstract, because the claim is
     * only true while it is true. `{n}` and `{total}` are filled from the
     * house on screen, so a survey landing moves this sentence without anyone
     * remembering to edit it.
     */
    markAll: t(
      'Seluruh {total} bagian bertumpu pada sedikitnya satu ukuran perkiraan penulis.',
      'All {total} parts rest on at least one dimension the author invented.',
    ),
    markSome: t(
      '{n} dari {total} bagian bertumpu pada sedikitnya satu ukuran perkiraan penulis.',
      '{n} of {total} parts rest on at least one dimension the author invented.',
    ),
    markWhy: t(
      'Aturan kanon dalam pustaka menyatakan struktur \u2014 arah hadap, punggung yang melengkung, tanduk sebagai catatan \u2014 bukan panjang. Jadi logika bentuknya bersumber, ukurannya tidak.',
      'The canon rules in the pack state structure \u2014 which way it faces, that the ridge sags, that the horns are a tally \u2014 not lengths. So the shape\u2019s logic is sourced and its sizes are not.',
    ),
    byPart: t('Menurut bagian', 'By part'),
    byDimension: t('Menurut ukuran', 'By dimension'),
    renderWarning: t(
      'Gambar tiga dimensi yang mulus menyiratkan ketelitian yang tidak dimiliki sumbernya. Bilah ini yang menjaga keduanya jujur.',
      'A smooth 3D render implies a precision the sources do not have. This bar is what keeps the two honest.',
    ),
  },

  draw: {
    heading: t('Unduh gambar', 'Download drawing'),
    denah: t('Denah', 'Plan'),
    tampak: t('Tampak muka', 'Front elevation'),
    potongan: t('Potongan memanjang', 'Long section'),
    sheet: t('Lembar lengkap', 'Full sheet'),
    sheetGloss: t(
      'Ketiga gambar, daftar ukuran lengkap beserta kelas dan kutipannya, arah utara, dan bilah skala \u2014 pada satu lembar. Gambar ukur yang asal ukurannya tertinggal di situs adalah gambar yang kehilangan asal-usulnya begitu dicetak.',
      'All three drawings, the full dimension table with its classes and citations, a north point and a scale bar \u2014 on one page. A measured drawing whose provenance stays on a website is a drawing that loses it the moment it is printed.',
    ),
    gloss: t(
      'Gambar garis ortografis 1:50, dalam SVG. Garis bisa diperiksa; gambar berbayang tidak. Setiap lembar mencantumkan berapa persen ukurannya adalah perkiraan penulis.',
      'An orthographic line drawing at 1:50, as SVG. Lines can be checked; a shaded image cannot. Every sheet states what share of its dimensions are the author’s own.',
    ),
  },

  scale: t('Skala', 'Scale'),
  legend: t('Keterangan', 'Legend'),

  views: {
    /* Names the group of camera presets for a screen reader; not drawn. */
    legend: t('Tampilan', 'View'),
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
    /* Names the façade/section pair for a screen reader; not drawn. */
    sectionLegend: t('Tampilan rumah', 'How the house is shown'),
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
    stageValue: t('{stage}, {pct}% dari urutan', '{stage}, {pct}% through the sequence'),
    /* The scrubber's resting position: the house is up, no stage is running. */
    complete: t('Rangka berdiri', 'Frame standing'),
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
    explodeValue: t('terurai {pct}%', '{pct}% exploded'),
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
    ran: t('Diuji pada rumah', 'Checked against the house'),
    counterHeading: t('Yang dicegah pemeriksaan', 'What a check is preventing'),
    counterIntro: t(
      'Sepuluh baris hijau tidak memberi alasan untuk percaya. Jadi satu pemeriksaan dijalankan pada rumah yang sengaja dibuat gagal, dan yang tercetak di bawah adalah putusan pemeriksaan itu sendiri, bukan uraian penulis.',
      'Ten green rows are not a reason to believe anything. So one check is run against a house built to break it, and what is printed below is that check\u2019s own verdict rather than a description of it.',
    ),
    counterWhy: t(
      'Haluan depan berdiri lebih tinggi daripada haluan belakang. Itu pernyataan sumber, bukan hasil hitungan \u2014 dan itulah yang membuat satu rumah cukup untuk menentukan arah seluruh halaman. Naikkan haluan belakang melewati depan dan rumah kehilangan kemampuan menyatakan mana mukanya.',
      'The front prow stands higher than the rear. That is a claim a source makes, not something the arithmetic guarantees \u2014 and it is what makes one house enough to orient a whole courtyard. Raise the rear prow past the front and the house loses the ability to say which end is its face.',
    ),
    counterSound: t('Rumah seperti dibangun', 'The house as built'),
    counterBroken: t('Haluan belakang dinaikkan ke {value} m', 'Rear prow raised to {value} m'),
    counterProws: t('depan / belakang', 'front / rear'),
    counterNote: t(
      'Rumah kedua ini tidak pernah dirender. Ia dibangun saat build, dinyatakan gagal, lalu dibuang.',
      'The second house is never rendered. It is built during the build, failed, and thrown away.',
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
    intro: t(
      'Setiap ukuran yang membentuk rumah ini ada di bawah, beserta kelas dan kutipannya. Inilah lapisan kejujuran proyek ini, dan ia diberi ruangnya sendiri karena gambar tiga dimensi yang mulus menyiratkan ketelitian yang tidak dimiliki sumbernya.',
      'Every dimension the house is generated from is below, with its class and its citation. This is the project’s honesty layer, and it is given a room of its own because a smooth 3D render implies a precision the sources do not have.',
    ),
    tableHeading: t('Daftar ukuran', 'The dimensions'),
    sensitivityHeading: t('Mana yang paling menentukan', 'Which of these matters most'),
    sensitivityIntro: t(
      'Hampir semua ukuran di halaman ini adalah perkiraan penulis. Yang tidak dikatakan bilah asal ukuran adalah apakah itu penting. Tiap baris di bawah dihitung dengan membangun ulang rumah: satu ukuran digeser {pct}%, lalu diukur sejauh mana rumah ikut bergeser. Tidak ada yang ditaksir — angkanya adalah selisih dua hasil generator.',
      'Nearly every dimension on this page is the author\u2019s own. What the provenance bar does not say is whether that matters. Each row below is computed by rebuilding the house: one dimension is pushed {pct}%, and the house is measured to see how far it follows. Nothing is estimated \u2014 the figures are the difference between two runs of the generator.',
    ),
    sensitivityCaveat: t(
      'Ini kepekaan, bukan ketidakpastian: yang ditunjukkan adalah apa yang bergerak, bukan seberapa mungkin nilainya keliru. Angka {pct}% itu sendiri pilihan penulis.',
      'This is sensitivity, not uncertainty: it shows what moves, not how likely the value is to be wrong. The {pct}% is itself the author\u2019s choice.',
    ),
    sensitivityWorst: t('Pergeseran terbesar', 'Largest shift'),
    sensitivityNone: t('Tidak menggeser ukuran apa pun', 'Moves no measurement'),
    ifWrong: t('Bila meleset {pct}%', 'If {pct}% out'),
    measureFirst: t(
      'Bila hanya satu ukuran yang bisa disurvei, ini yang pertama.',
      'If only one dimension could be surveyed, this is the one.',
    ),
    sourceHeading: t('Daftar pustaka', 'Bibliography'),
    key: t('Kunci', 'Key'),
  },
} as const

export function pick(dict: Dict, locale: Locale): string {
  return dict[locale]
}

/**
 * The document title for a route.
 *
 * Every route shipped as "Tongkonan", so a reader with four tabs open, or one
 * listening to a screen reader announce a page load, could not tell them
 * apart. The route name comes first because that is what distinguishes the
 * tab; the app name follows because that is what groups them.
 */
export function pageTitle(route: Route, locale: Locale): string {
  return `${pick(COPY.nav[route], locale)} — ${pick(COPY.appName, locale)}`
}
