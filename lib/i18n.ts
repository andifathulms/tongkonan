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

/**
 * A page address: locale, then tradition, then route.
 *
 * The tradition is a path segment and not a query parameter. The query string
 * is the house — a complete description of one building, in that tradition's
 * own parameter names — and a tradition selects which rule pack those names
 * belong to. Putting it in the query would make one string mean two kinds of
 * thing at once.
 */
export function href(locale: Locale, tradition: string, route: Route): string {
  return `/${locale}/${tradition}/${route}`
}

/** The landing page: the whole collection, in one language. */
export function homeHref(locale: Locale): string {
  return `/${locale}`
}

/** A house's own front door, above its four routes. */
export function houseHref(locale: Locale, tradition: string): string {
  return `/${locale}/${tradition}`
}

type Dict = Record<Locale, string>

const t = (id: string, en: string): Dict => ({ id, en })

export const COPY = {
  /*
   * The project is named for what it holds.
   *
   * It was called Tongkonan while there was one house, and Pasak — the peg
   * that pins a mortise and tenon — while the point was that two houses met
   * one core. With four houses and more intended, the collection is the
   * subject, and the name says plainly what a visitor finds: the traditional
   * houses of the archipelago, each generated from its own rules. It is a
   * proper name, so it is the same in both locales.
   */
  appName: t('Rumah Adat Nusantara', 'Rumah Adat Nusantara'),
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
    'Ubah salah satu aturan sosial rumah ini — rumah dihitung ulang dari aturan itu.',
    'Change one of this house’s social rules — the house is recomputed from it.',
  ),
  /*
   * Says both ways of doing it, in one line, so it is not two pieces of copy
   * that can disagree — and so it can be the canvas's description rather than
   * a second hidden sentence saying the same thing to a screen reader.
   */
  hint: t(
    'Seret atau tombol panah untuk memutar · gulir atau +/− untuk mendekat',
    'Drag or arrow keys to rotate · scroll or +/− to zoom',
  ),
  computed: t('Dihitung dari aturan', 'Computed from the rules'),

  /* The first tab stop on the working routes, for keyboard readers: the rail
     holds every control, and the drawing should not cost a walk through all
     of them. */
  skip: t('Langsung ke isi', 'Skip to content'),

  /*
   * The 404, written for both readers at once: the page that answers a wrong
   * address cannot know which language its reader asked in.
   */
  notFound: {
    heading: t('Halaman tidak ditemukan', 'Page not found'),
    line: t(
      'Alamat ini tidak menunjuk ke halaman mana pun. Rumah-rumahnya masih di tempatnya.',
      'This address does not point at any page. The houses are where they were.',
    ),
  },

  /*
   * The landing page. The collection's own copy: what this is, how it came to
   * be more than one house, and where each house stands. Counts are never
   * written into these sentences — a fifth house must not turn any of them
   * into a lie.
   */
  landing: {
    lede: t(
      'Setiap rumah di sini dibangkitkan dari aturan sosialnya sendiri — sebuah pangkat, jumlah ruang, catatan upacara — bukan dari gambar bentuknya. Ubah satu aturan, dan rumah dihitung ulang dari aturan itu.',
      'Every house here is generated from its own social rules — a rank, a bay count, a tally of ceremonies — rather than from a drawing of its shape. Change one rule, and the house is recomputed from it.',
    ),
    storyHeading: t('Ceritanya', 'The story'),
    story: [
      t(
        'Mulanya satu rumah: tongkonan. Tiga aturan sosial — pangkat, jumlah ruang, catatan upacara pada tanduk di tiangnya — menghasilkan setiap ukuran, dan dari ukuran itu berdirilah modelnya.',
        'It began with one house: the tongkonan. Three social rules — rank, bay count, the tally of funerals on the horns of its post — produce every dimension, and from those dimensions the model stands.',
      ),
      t(
        'Lalu rumah gadang, yang menolak menyerupainya — dan penolakan itu terus berulang: ada yang tidak berdiri di atas tiang, ada yang bulat, ada yang mengapung, ada yang berdiri di pohon hidup, ada yang dibangun untuk satu sore lalu dibakar. Justru itulah gunanya: tiap tradisi membawa pak aturannya sendiri, dan tidak ada yang dipaksa memakai bentuk milik yang lain.',
        'Then the rumah gadang, which refused to resemble it — and the refusals kept coming: some do not stand on posts, one is round, one floats, one stands in a living tree, one is built for a single afternoon and then burned. That is the point: each tradition carries its own rule pack, and none is made to wear another’s shape.',
      ),
      t(
        'Setiap ukuran menyatakan asalnya — terukur, kanon, atau perkiraan penulis — dan angka tiap tradisi tidak pernah dirata-ratakan dengan yang lain. Yang bersumber adalah logika bentuknya; ukurannya sebagian besar belum.',
        'Every dimension states where it came from — measured, canon, or the author’s own — and no tradition’s figures are ever averaged with another’s. What is sourced is the logic of each shape; the sizes mostly are not.',
      ),
      t(
        'Belum satu pun rumah ini disurvei. Bilah asal ukuran pada tiap halaman adalah tolok kemajuan proyek ini, dan hari ini bilah itu hampir seluruhnya merah. Ia dibiarkan terlihat, karena gambar tiga dimensi yang mulus menyiratkan ketelitian yang tidak dimiliki sumbernya.',
        'Not one of these houses has been surveyed yet. The provenance bar on every page is this project’s progress metric, and today it is almost entirely red. It stays in view, because a smooth 3D render implies a precision the sources do not have.',
      ),
    ],
    /*
     * The same-scale elevation shelf. The caption states the two claims the
     * drawing makes — one scale, drawn from the model's own parts — because
     * a silhouette without them is just a logo.
     */
    shelfCaption: t(
      'Satu skala untuk semua rumah, digambar dari bagian-bagian model itu sendiri.',
      'One scale for every house, drawn from the model’s own parts.',
    ),
    /* Alt text for a house's share card. The card carries no text of its
       own — the unfurled link already shows title and description — so the
       alt says what the picture is. */
    ogAlt: t(
      'Siluet tampak {house}, digambar dari bagian-bagian model.',
      'The elevation silhouette of {house}, drawn from the model’s parts.',
    ),
    elevationCaption: t(
      'Tampak, digambar dari bagian-bagian model pada aturan bakunya.',
      'The elevation, drawn from the model’s parts at its default rules.',
    ),
    sitesHeading: t('Tapak', 'The sites'),
    sitesNote: t(
      'Setiap bangunan digambar dari bagian-bagian modelnya sendiri dan berdiri di tapaknya. Matahari pada tiap model dihitung untuk koordinat tapak itu — koordinat yang sama yang menempatkannya di peta ini.',
      'Each building is drawn from its own model’s parts and stands at its site. The sun in each model is computed for that site’s coordinates — the same coordinates that place it on this map.',
    ),
    housesHeading: t('Rumah-rumahnya', 'The houses'),
    parts: t('bagian', 'parts'),
    joints: t('sambungan', 'joints'),
    interpolatedShare: t(
      '{pct}% ukuran perkiraan penulis',
      '{pct}% of dimensions the author’s own',
    ),
    enter: t('Masuk', 'Enter'),
    /*
     * The catalogue plate label on each index card: T for tradisi, numbered
     * in the order the houses joined the registry — which is the order the
     * project learned what generalises, so the number is history, not
     * decoration. The map's markers carry the same numbers.
     */
    plate: t('Lembar', 'Plate'),
    doorsHeading: t('Cara membaca rumah ini', 'Ways to read this house'),
  },
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
    rankHint: t(
      'Pangkat mengalikan setiap ukuran panjang dengan angka di samping namanya — itu saja yang dilakukannya. Rumah berpangkat lebih tinggi bukan berbentuk lain; ia berbentuk sama, lebih besar. Kedudukan dinyatakan lewat skala.',
      'Rank multiplies every length by the figure beside its name, and that is the only thing it does. A higher-ranked house is not a different shape; it is the same shape, larger. Standing is expressed as scale.',
    ),
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
    site: t('Tapak', 'The site'),
    unusual: t(
      'Jumlah ruang ini melampaui yang lazim untuk pangkat tersebut.',
      'This bay count exceeds what the rank customarily reaches.',
    ),
  },

  place: {
    heading: t('Rumah siapa ini', 'Whose house this is'),
    /*
     * The prose lives with the house it describes, in that tradition's facade
     * module, not here. Copy about the interface is shared; copy about a
     * building is that building's, or it drifts the moment there are two.
     */
  },

  orientation: {
    heading: t('Arah hadap', 'Orientation'),
    /* The rule itself is per tradition: one is a compass bearing, one is not. */
  },

  derivation: {
    heading: t('Cara rumah ini dihitung', 'How this house was worked out'),
    intro: t(
      'Tiga aturan di atas menghasilkan setiap ukuran di bawah. Ini perhitungannya, bukan ringkasannya — angka yang sama yang membentuk model di sebelah.',
      'The three rules above produce every dimension below. This is the working, not a summary of it — the same numbers that built the model beside it.',
    ),
    yours: t('pilihan Anda', 'yours'),
    carried: t('dari langkah di atas', 'from the step above'),
    foot: t(
      'Titik merah berarti angka itu tidak punya sumber: penulis menetapkannya untuk menutup celah. Sebagian besar perhitungan ini bertumpu pada angka semacam itu.',
      'A red dot means that number has no source — the author set it to close a gap. Most of this working rests on numbers like that.',
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
    /*
     * Named for the ground it is taken from rather than for the camera. Every
     * other view here is a way of looking at the model; this one is a place to
     * stand, and the place is the tradition's own — where the house is
     * addressed from, which is what its orientation rule has always said.
     */
    halaman: t('Dari halaman', 'From the yard'),
    tampak: t('Tampak muka', 'Elevation'),
    kolong: t('Kolong', 'Underfloor'),
  },

  tradition: {
    /*
     * Said where the houses are listed, because a reader who has just watched
     * one house rebuild from its rules will assume the next is the same house
     * with different numbers. It is not, and the app would be lying by layout
     * if it did not say so. Written without a count, so the next house cannot
     * turn it into a lie.
     */
    note: t(
      'Setiap tradisi membawa pak aturan dan tabel sumbernya sendiri. Angka-angkanya tidak pernah digabung, dan tidak ada rumah yang berubah menjadi rumah lain.',
      'Every tradition carries its own rule pack and its own source table. The figures are never merged, and no house turns into another.',
    ),
    all: t('Semua rumah', 'All houses'),
  },

  site: {
    heading: t('Tapak', 'The site'),
    intro: t(
      'Yang ada di tanah sekeliling rumah, dan hanya yang dikatakan sumbernya. Yang berdiri di sini adalah massa: lumbung tampil sebagai badan dan atapnya sebesar yang disebut sumber, tanpa satu pun dari puluhan bagiannya; kubur batu adalah papan di atas kaki, tanpa ukiran; air adalah satu permukaan datar yang tidak bergerak dan tidak memantulkan apa-apa. Tidak ada tanaman dan tidak ada bukit. Ukurannya semua tercatat di tabel dimensi dan hampir semuanya penetapan penulis — yang dibeli dengan menggambarnya adalah letak, bukan pengetahuan baru.',
      'What is on the ground around the house, and only what the sources say is. What stands here is massing: a granary appears as a body and a roof at the size the sources give it, with none of its dozens of parts; a stone grave is a slab on legs, uncarved; water is one flat surface that neither moves nor reflects. There is no vegetation and no terrain. Every figure is in the dimension table and nearly all of them are the author’s — what drawing them buys is where things are, not new knowledge.',
    ),
    /* The names and glosses are vocabulary, so they live in each scene model. */
  },

  zones: {
    heading: t('Tiga tingkat', 'The three zones'),
    /* The names and glosses are vocabulary, so they live in each scene model. */
  },

  read: {
    heading: t('Yang bisa dibaca', 'What can be read'),
    intro: t(
      'Rumah ini menyatakan dirinya kepada siapa pun yang berjalan mendekat. Tidak satu pun dari keterangan berikut tertulis; semuanya terbaca dari bentuk.',
      'The house states itself to anyone walking up to it. None of the following is written down; all of it is read off the form.',
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
    counterSound: t('Rumah seperti dibangun', 'The house as built'),
    counterBroken: t('Haluan belakang dinaikkan ke {value} m', 'Rear prow raised to {value} m'),
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
    compareHeading: t('Seperti apa kalau meleset', 'What being wrong looks like'),
    compareCaption: t(
      'Garis utuh: {dim} sebagaimana ditetapkan, {from} m. Garis putus merah: nilai yang sama digeser {pct}%, menjadi {to} m. Keduanya digambar dari generator yang sama pada sumbu yang sama. Tidak ada kendali di sini — {dim} bukan parameter, dan tidak akan menjadi parameter.',
      'Solid: {dim} as the pack sets it, {from} m. Dashed red: the same value pushed {pct}%, to {to} m. Both are drawn by the same generator on the same axes. There is no control here — {dim} is not a parameter and will not become one.',
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
 * The catalogue plate number as it is printed: T for tradisi, two digits,
 * numbered in registry order — the order the houses joined, which is the
 * order the project learned what generalises. The landing cards, the map
 * markers and each house's own sheet all print the same number.
 */
export function plateNo(n: number): string {
  return `T.${String(n).padStart(2, '0')}`
}

/** A latitude, said the way the locale says it: 3,0° LS in id, 3.0° S in en. */
export function latLabel(lat: number, locale: Locale): string {
  const n = Math.abs(lat).toFixed(1)
  const figure = locale === 'id' ? n.replace('.', ',') : n
  const hemi = lat < 0 ? (locale === 'id' ? 'LS' : 'S') : locale === 'id' ? 'LU' : 'N'
  return `${figure}° ${hemi}`
}

/**
 * The document title for a route.
 *
 * Every route shipped as "Tongkonan", so a reader with four tabs open, or one
 * listening to a screen reader announce a page load, could not tell them
 * apart. The route name comes first because that is what distinguishes the
 * tab; the app name follows because that is what groups them.
 */
export function pageTitle(route: Route, locale: Locale, house: string): string {
  return `${pick(COPY.nav[route], locale)} — ${house} — ${pick(COPY.appName, locale)}`
}

/**
 * The description for a route, built from what the route actually says.
 *
 * Both halves are on the page: the gloss is printed under the route's own nav
 * item, and the tagline is the largest line in the title block. A description
 * written separately is a description free to drift from the page it
 * describes, and a stale one is worse than none.
 */
export function pageDescription(route: Route, locale: Locale, house: string): string {
  return `${house}. ${pick(COPY.navGloss[route], locale)} ${pick(COPY.tagline, locale)}`
}

/**
 * Where this is deployed, for canonical and share URLs.
 *
 * GitHub Pages serves a project site from a subpath, so the base path is
 * already threaded through the build; this is the origin in front of it. Both
 * fall back to the repository's own Pages address so a local build produces
 * the same absolute URLs the deployed one will.
 */
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'https://andifathulms.github.io'
).replace(/\/$/, '')

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/rumah-adat-nusantara'

/** The absolute, canonical address of a route. */
export function pageUrl(route: Route, locale: Locale, tradition: string): string {
  return `${SITE_ORIGIN}${BASE_PATH}/${locale}/${tradition}/${route}/`
}

/** The absolute address of the landing page. */
export function landingUrl(locale: Locale): string {
  return `${SITE_ORIGIN}${BASE_PATH}${homeHref(locale)}/`
}

/** The absolute address of a house's front door. */
export function houseUrl(locale: Locale, tradition: string): string {
  return `${SITE_ORIGIN}${BASE_PATH}${houseHref(locale, tradition)}/`
}

/** OpenGraph's locale format, which is not the one in our URLs. */
const OG_LOCALE: Record<Locale, string> = { id: 'id_ID', en: 'en_US' }

/**
 * Everything a page needs in its head, from one call.
 *
 * Kept in one place so the pages cannot describe themselves several different
 * ways, and so canonical, alternates and the share card are always generated
 * together — the failure mode is adding one of them and forgetting the rest.
 * `urlFor` is a function of the locale because the alternates are the same
 * page in the other language, whatever kind of page it is.
 */
function head(
  locale: Locale,
  title: string,
  description: string,
  urlFor: (l: Locale) => string,
  /**
   * The share card: a file under public/og/, drawn by the generator and held
   * by test/og.test.ts against what the generator would draw today. Relative
   * to metadataBase, so the base path is applied once, there.
   */
  image: { file: string; alt: string },
) {
  const url = urlFor(locale)
  const images = [{ url: image.file, width: 1200, height: 630, alt: image.alt }]
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(LOCALES.map((l) => [l, urlFor(l)])),
    },
    openGraph: {
      type: 'website' as const,
      title,
      description,
      url,
      siteName: pick(COPY.appName, locale),
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images,
    },
  }
}

/** A house's card and its alt, from the slug the card file is named by. */
function houseImage(locale: Locale, slug: string, house: string) {
  return {
    file: `og/${slug}.png`,
    alt: pick(COPY.landing.ogAlt, locale).replace('{house}', house),
  }
}

export function routeMetadata(
  route: Route,
  locale: Locale,
  tradition: { slug: string; house: string },
) {
  return head(
    locale,
    pageTitle(route, locale, tradition.house),
    pageDescription(route, locale, tradition.house),
    (l) => pageUrl(route, l, tradition.slug),
    houseImage(locale, tradition.slug, tradition.house),
  )
}

/** The landing page's head. `houses` is the house names, joined, from the registry. */
export function landingMetadata(locale: Locale, houses: string) {
  return head(
    locale,
    pick(COPY.appName, locale),
    `${pick(COPY.tagline, locale)} ${houses}.`,
    (l) => landingUrl(l),
    /* The collection's card is the shelf, and its caption already says
       exactly what the picture is. */
    { file: 'og/semua.png', alt: pick(COPY.landing.shelfCaption, locale) },
  )
}

/** A house front door's head. */
export function houseMetadata(
  locale: Locale,
  tradition: { slug: string; house: string; place: string },
) {
  return head(
    locale,
    `${tradition.house} — ${pick(COPY.appName, locale)}`,
    `${tradition.house}, ${tradition.place}. ${pick(COPY.tagline, locale)}`,
    (l) => houseUrl(l, tradition.slug),
    houseImage(locale, tradition.slug, tradition.house),
  )
}
