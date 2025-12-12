# Projektas "Glim"

Tai internetinė platforma, padedanti supaprastinti kasdienį socialinių tinklų naudojimą ir paversti praleidžiamą laiką prasmingiau.

---

## Apie Projektą

Pagrindinis platformos tikslas - pateikti žinutės skelbimus kurie būtų prasmingi vartotojui, taupant laiką ir mažinant socialinių tinklų priklausomybę

---

## Pagrindinės Funkcijos

* **Neregistruotas vartotojas**: Gali naudotis platforma neprisiregistravęs – matyti bendrą pateiktą informaciją ir registruotis kaip narys.
* **Registruotas vartotojas**: Prisiregistravęs asmuo gali matyti vartotojų keliamus įrašus, su jais sąveikauti (palikti komentarą, uždėti teigiamą arba neigiamą reakciją) bei pats kelti įrašus.
* **Laikmačio sistema**: Prie kiekvieno įrašo pritvirtintas laikmatis. Jis ištrina įrašą laikui praėjus. Laikas gali būti pratęsiamas, jeigu kitas vartotojas pasirenka teigiamai įvertinti įrašą (palieka teigiamą reakciją).
* **Administratoriaus valdymas**: Administratorius tikrina vartotojų praleidimo svetainėje laiką, peržiūri įrašus, gali juos ištrinti ir atgaivinti (pridėti daugiau laiko) bei valdyti įrašų kategorijas.

---

## Sistemos sudedamosios dalys

* **Kliento pusė (Front-End)** – Next.js (talpinama Vercel platformoje)
* **Serverio pusė (Back-End)** – Node.js su Express (talpinama Render platformoje)
* **Duomenų bazė** – PostgreSQL (talpinama Supabase platformoje)

---

## Naudotojo sąsajos projektas

### Pagrindinis puslapis (/home)

**Puslapio funkcijos:**
* Rodo visų įrašų sąrašą, surūšiuotą pagal prisegimą ir datą
* Leidžia kurti naujus įrašus su pasirinktomis kategorijomis ir galiojimo laiku (tik prisijungusiems vartotojams)
* Įrašų „like/dislike" reakcijos
* Galimybė prisegti įrašus prie viršaus (tik admin tipo vartotojai)
* Redaguoti ir ištrinti savo įrašus
* Atgaivinti įrašus (tik admin tipo vartotojai)
* Ištrinti įrašus (tik admin tipo vartotojai)

**Įgyvendinto puslapio skirtumai:**
* Įrašo kūrimo forma matoma tik prisijungusiems vartotojams
* Rodomas įrašo galiojimo laikas su animuotu laikmačiu
* Galimybė prisegti įrašai turi atskiriamai matomą žymeklį
* Galimybė redaguoti ir trinti kategorijas

### Prisijungimo puslapis (/login)

**Puslapio funkcijos:**
* Galimybė prisijungti su vartotojo vardu arba el. paštu
* Vartotojas nukreipiamas į pagrindinį puslapį po sėkmingo prisijungimo
* Rodoma nuoroda į registracijos puslapį

**Įgyvendinto puslapio skirtumai:**
* Rodomi klaidų pranešimai „toast" tipo žinutėmis
* Skirtingas animuotas fonas
* Skirtingos registravimo teksto spalvos
* Šešėlinis tekstas laukuose

### Registravimosi puslapis (/register)

**Puslapio funkcijos:**
* Galimybė sukurti naują paskyrą su vartotojo vardu, el. paštu ir slaptažodžiu
* Slaptažodžio patvirtinimo laukas
* Nukreipimas į prisijungimo puslapį po sėkmingos registracijos

**Įgyvendinto puslapio skirtumai:**
* Slaptažodžio laukai turi matomumo perjungimą
* Skirtingas animuotas fonas
* Skirtingos registravimo teksto spalvos
* Šešėlinis tekstas laukuose

### Paskyros puslapis (/profile)

**Puslapio funkcijos:**
* Rodo vartotojo profilį su avataru ir aprašymu
* Keisti profilio nuotrauką (įkelti/pašalinti)
* Redaguoti aprašymą
* Rodo visus vartotojo sukurtus įrašus
* Atsijungti iš paskyros

**Įgyvendinto puslapio skirtumai:**
* Neprisijungusiems vartotojams rodomi prisijungimo/registracijos mygtukai
* Avataro keitimas vyksta paspaudžiant ant nuotraukos

### Įrašo puslapis (/home/[postId])

**Puslapio funkcijos:**
* Puslapis prieinamas tik prisijungusiems vartotojams
* Rodo pilną įrašo turinį su autoriaus informacija
* Komentarų skaitymas ir rašymas
* Komentarų like/dislike reakcijos
* Redaguoti ir ištrinti savo įrašą
* Prisegti įrašą (tik admin)
* Atgaivinti įrašus (tik admin tipo vartotojai)
* Ištrinti įrašus (tik admin tipo vartotojai)
* Ištrinti komentarus (tik admin tipo vartotojai)

**Įgyvendinto puslapio skirtumai:**
* Neprisijungę vartotojai nukreipiami į prisijungimo puslapį
* Ištrintas arba pasibaigęs įrašas nukreipia į pagrindinį puslapį (tik prisijungusiems vartotojams)

---

## API specifikacija

### Vartotojai (Users)

| Metodas | Endpoint | Paskirtis | Naudojama puslapiuose | Grąžina |
|---------|----------|-----------|----------------------|---------|
| POST | `/api/users/register` | Registruoja naują vartotoją sistemoje | register | patvirtinimo žinutę |
| POST | `/api/users/login` | Autentifikuoja vartotoją ir išduoda JWT prieigos bei atnaujinimo žetonus | login | prieigos žetoną, atnaujinimo žetoną, vartotojo ID, vardą, rolę ir avataro URL |
| POST | `/api/users/refresh` | Atnaujina pasibaigusį prieigos žetoną naudojant atnaujinimo žetoną | Visi puslapiai (automatinis atnaujinimas) | naują prieigos žetoną |
| GET | `/api/users/me` | Gauna prisijungusio vartotojo profilio informaciją | profile | vartotojo ID, vardą, rodomą vardą, bio ir avataro URL |
| PUT | `/api/users/me` | Atnaujina prisijungusio vartotojo rodomą vardą arba bio | profile | atnaujintą vartotojo profilio informaciją |
| POST | `/api/users/me/avatar` | Įkelia naują vartotojo profilio nuotrauką | profile | atnaujintą vartotojo profilio informaciją su nauju avataro URL |
| DELETE | `/api/users/me/avatar` | Pašalina vartotojo profilio nuotrauką | profile | patvirtinimo žinutę |
| GET | `/api/users/me/posts` | Gauna visus prisijungusio vartotojo sukurtus įrašus | profile | įrašų masyvą |
| GET | `/api/users` | Gauna visų registruotų vartotojų sąrašą | Administravimo funkcijos (nenaudojama) | vartotojų masyvą su pagrindiniais duomenimis |

### Įrašai (Posts)

| Metodas | Endpoint | Paskirtis | Naudojama puslapiuose | Grąžina |
|---------|----------|-----------|----------------------|---------|
| GET | `/api/posts` | Gauna visus nepasibaigusius įrašus, surikiuotus pagal prisegimą ir datą | home | įrašų masyvą su pagrindiniais duomenimis |
| POST | `/api/posts` | Sukuria naują laikiną įrašą su nurodyta gyvavimo trukme | home (PostForm komponentas) | patvirtinimo žinutę |
| GET | `/api/posts/:postId` | Gauna konkretų įrašą pagal jo ID su reakcijų informacija | home/[postId] | įrašo duomenis, kategorijas, reakcijų skaičius ir vartotojo reakciją |
| PUT | `/api/posts/:postId` | Atnaujina esamo įrašo turinį (tik autorius) | home/[postId] | patvirtinimo žinutę |
| DELETE | `/api/posts/:postId` | Ištrina įrašą ir visus susijusius duomenis (tik autorius arba administratorius) | home, home/[postId] | patvirtinimo žinutę |

### Įrašų reakcijos (Post Reactions)

| Metodas | Endpoint | Paskirtis | Naudojama puslapiuose | Grąžina |
|---------|----------|-----------|----------------------|---------|
| GET | `/api/posts/:postId/reactions` | Gauna įrašo „like/dislike" skaičių | home/[postId] | patiktukų ir nepatiktukų skaičius |
| POST | `/api/posts/:postId/reactions` | Sukuria, atnaujina arba pašalina vartotojo reakciją | home, home/[postId] (FlameTimer komponentas) | žinutę, reakcijų skaičius, vartotojo reakciją ir naują galiojimo laiką |
| GET | `/api/posts/:postId/reactions/me` | Gauna prisijungusio vartotojo reakciją konkrečiam įrašui | home/[postId] | vartotojo reakcijos tipą |
| PUT | `/api/posts/:postId/reactions/:reactionId` | Atnaujina esamą reakciją į kitą tipą | Nenaudojama | žinutę ir atnaujintus reakcijų skaičius |
| DELETE | `/api/posts/:postId/reactions/:reactionId` | Pašalina vartotojo reakciją nuo įrašo | Nenaudojama | žinutę ir atnaujintus reakcijų skaičius |

### Komentarai (Comments)

| Metodas | Endpoint | Paskirtis | Naudojama puslapiuose | Grąžina |
|---------|----------|-----------|----------------------|---------|
| GET | `/api/posts/:postId/comments` | Gauna visus įrašo komentarus, surikiuotus pagal sukūrimo datą | home/[postId] | komentarų masyvą |
| POST | `/api/posts/:postId/comments` | Sukuria naują komentarą arba atsakymą į komentarą | home/[postId] (CommentForm komponentas) | žinutę, komentaro ID ir sukūrimo datą |
| GET | `/api/posts/:postId/comments/:commentId` | Gauna konkretų komentarą pagal jo ID | home/[postId]/comments/[commentId] | komentaro duomenis su autoriaus informacija |
| PUT | `/api/posts/:postId/comments/:commentId` | Atnaujina komentaro turinį (tik autorius) | home/[postId] | patvirtinimo žinutę |
| DELETE | `/api/posts/:postId/comments/:commentId` | Ištrina komentarą (tik autorius) | home/[postId] | patvirtinimo žinutę |

### Komentarų reakcijos (Comment Reactions)

| Metodas | Endpoint | Paskirtis | Naudojama puslapiuose | Grąžina |
|---------|----------|-----------|----------------------|---------|
| GET | `/api/posts/:postId/comments/:commentId/reactions` | Gauna komentaro patiktukų ir nepatiktukų skaičių | home/[postId] | „like/dislike" kiekį |
| POST | `/api/posts/:postId/comments/:commentId/reactions` | Sukuria, atnaujina arba pašalina vartotojo reakciją komentarui | home/[postId] (CommentReactionField komponentas) | patvirtinimo žinutę |
| GET | `/api/posts/:postId/comments/:commentId/reactions/me` | Gauna prisijungusio vartotojo reakciją konkrečiam komentarui | home/[postId] | vartotojo reakcijos tipą |
| PUT | `/api/posts/:postId/comments/:commentId/reactions/:reactionId` | Atnaujina esamą komentaro reakciją | Nenaudojama | patvirtinimo žinutę |
| DELETE | `/api/posts/:postId/comments/:commentId/reactions/:reactionId` | Pašalina vartotojo reakciją nuo komentaro | Nenaudojama | patvirtinimo žinutę |

### Kategorijos (Categories)

| Metodas | Endpoint | Paskirtis | Naudojama puslapiuose | Grąžina |
|---------|----------|-----------|----------------------|---------|
| GET | `/api/categories` | Gauna visų kategorijų sąrašą abėcėlės tvarka | home (PostForm - kategorijų pasirinkimas) | kategorijų masyvą |
| GET | `/api/categories/:categoryId` | Gauna konkrečios kategorijos informaciją | home (Kategorijų filtravimas) | kategorijos ID, pavadinimą ir aprašymą |
| PUT | `/api/categories/:categoryId` | Atnaujina kategorijos pavadinimą arba aprašymą | home | patvirtinimo žinutę |
| DELETE | `/api/categories/:categoryId` | Ištrina kategoriją (įrašai lieka, tik atsiejami) | Nenaudojama (Administravimo funkcijos) | patvirtinimo žinutę |
| POST | `/api/categories` | Prideda kategoriją | home (Administravimo funkcijos) | patvirtinimo žinutę |
| GET | `/api/categories/:categoryId/posts` | Gauna visus įrašus, priklausančius konkrečiai kategorijai | Nenaudojama | įrašų masyvą |

### Administravimas (Admin)

| Metodas | Endpoint | Paskirtis | Naudojama puslapiuose | Grąžina |
|---------|----------|-----------|----------------------|---------|
| DELETE | `/api/admin/posts/:postId` | Administratorius ištrina bet kurį įrašą nepriklausomai nuo autorystės | home, home/[postId] (DevTools komponentas) | patvirtinimo žinutę |
| PATCH | `/api/admin/posts/:postId/revive` | Pratęsia įrašo gyvavimo laiką nurodytam laikui | home, home/[postId] (DevTools komponentas) | žinutę ir naują galiojimo datą |
| PATCH | `/api/admin/posts/:postId/pin` | Prisega arba atsega įrašą puslapio viršuje | home, home/[postId] (DevTools komponentas) | žinutę ir prisegimo būseną |
| DELETE | `/api/admin/posts/:postId/comments/:commentId` | Administratorius ištrina bet kurį komentarą nepriklausomai nuo autorystės | home/[postId] (Administravimo funkcijos) | patvirtinimo žinutę |

---

## Licencija

Visos teisės saugomos. Šis kodas yra uždaras ir negali būti platinamas ar naudojamas be rašytinio autoriaus sutikimo.
