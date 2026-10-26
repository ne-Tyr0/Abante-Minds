# Abante Minds: legal and platform memo for opt-in analytics

> **Draft for review, not legal advice.** The shared copy of this memo is at https://claude.ai/artifact/MNXdJEXit9zSvhzNFmo5Hv; this file is its copy for the repo. Counts-only weekly totals (the "Update, 26 October 2026" section) are built but switched off; nothing ships until the owner approves.

As of 26 October 2026.

## Summary

**Verdict: opt-in analytics can ship legally, but not in the current design.** The Philippine Data Privacy Act (DPA) applies in full, wherever the server sits. The National Privacy Commission (NPC) would most likely treat the event stream as personal data about children's education. The law classes that as sensitive. Valid consent is then the only legal basis, and for an 11-12-year-old it should come from a parent. No platform term reviewed bans the plan. COPPA and the GDPR probably do not reach a Philippines-only app, and cheap steps shrink what risk remains.

*This memo summarises public sources, current to 21 October 2026, for a non-lawyer owner. It is not legal advice. Every conclusion needs confirmation by a Philippine privacy lawyer or a school Data Protection Officer (DPO).*

**The five findings that most change the design**

1. **The hidden sharing ID does not make the data anonymous.** The NPC says pseudonymised data "remains to be personal data" ([NPC AO 2018-029](https://privacy.gov.ph/wp-content/uploads/2022/01/AdOpNo.2018-029.pdf)). Test scores and grade level are sensitive "education" data ([NPC AO 2020-046](https://privacy.gov.ph/wp-content/uploads/2022/01/Redacted-Advisory-Opinion-No.-2020-046.pdf)). Sensitive data needs consent "specific to the purpose prior to the processing" ([DPA Sec. 13](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html)).
2. **A box the child ticks is not the parent's consent.** NPC opinions put minors' consent with parents or guardians. The NPC's children's advisory warns that self-declaration "may be inadequate" for risky processing ([NPC Advisory 2024-03](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf)). The parent needs to read an adult notice and act on the phone personally.
3. **NPC registration is probably mandatory, and the privacy contact cannot stay a personal Gmail.** Registration covers sensitive data of 1,000 or more people, or processing "likely to pose a risk" ([NPC Circular 2022-04 §5](https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04-2.pdf)). The DPO email must be "separate and distinct from the personal and work e-mail" (§8). A Child Privacy Impact Assessment (CPIA) is expected before launch ([Advisory 2024-03 §2(A)](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf)).
4. **Turning sharing off must delete, retention needs a number, and "research later" needs its own yes.** On withdrawal the controller must "stop the processing ... and delete the personal data" ([NPC Circular 2023-04 §13](https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf)). Data may not be kept "in perpetuity in contemplation of a possible future use" ([IRR Sec. 19(e)](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/)).
5. **Foreign hosting is allowed, but "IPs not stored" needs configuration and disclosure.** Cloudflare turns logging on by default for new Workers ([Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)). GitHub logs every Pages visitor's IP "for security purposes" ([GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)). Both must be named as recipients, under a processor contract with set contents.

**What must be confirmed before shipping**

- Whether the NPC treats sharing-ID events as personal and sensitive data. This is the biggest uncertainty. The NPC has never ruled on a random, device-generated ID.
- Which parent-consent step the NPC would accept as proportionate without collecting parent names or emails.
- Whether registration is mandatory, and how an unregistered individual developer completes it.
- Whether Cloudflare's click-through processor terms cover Philippine-only data and meet IRR Sec. 44.
- Whether the NPC adopted a new advisory on children's data in September 2026. Two secondary sources report one ([Context.ph](https://context.ph/2026/09/22/npc-tightens-scrutiny-of-digital-platforms-over-childrens-data/); [Digital Policy Alert](https://digitalpolicyalert.org/event/43940-national-privacy-commission-adopted-advisory-on-processing-of-childrens-personal-data)). The NPC's own issuance list, read 21 October 2026, did not show it ([NPC list](https://privacy.gov.ph/pips-and-pics/advisories-circulars/)).

## Update, 26 October 2026: counts only first

**The owner chose to start with counts only: no learner ID, and nothing kept per phone.** Built this way, the stored data is about learners in general, not any one child, which likely puts it outside the Data Privacy Act (question 3 below). It stays opt-in with a short notice, for trust. This is a proposed design for approval; nothing is built or deployed yet.

**What the phone sends, once a week, only if sharing is on**

| Part | Contents |
| --- | --- |
| Header | App version and the week (for example 2026-W44). No ID, no device details, no time of day |
| Path and Basics levels | Per level practised that week: questions answered, right first time, hints used, rounds finished, rounds left early |
| Review | Per review interval (1, 3 or 7 days): right and wrong |
| Basics facts | Per facts level: facts answered, right and quick |
| Practice exam | Number taken, and right and asked per topic |
| Feature use | Counts of streak screen views, badge views, and settings switched on |
| Errors | Counts per error code |

**What the server does with it**

1. Checks the report against the schema and sensible limits, and rejects anything else.
2. Adds each number into running totals for that week, app version, level and measure, and adds one to the week's report count.
3. Throws the report away. Nothing per report or per phone is stored, logs are off, and the IP address is never read or kept.
4. Hides any total built from fewer than 5 reports when the results are viewed.

**On the phone**

- One ask, at a calm moment, with a child-friendly line: "Help make Abante Minds better? Once a week the app sends totals, like how many questions you got right in each level. It never sends your name or anything that shows it is you." "Not now" keeps sharing off. The switch stays in Profile.
- The week's tallies are kept on the phone and sent after the week ends, when online. With sharing off, nothing is counted or sent, and turning it off clears tallies not yet sent.
- There is nothing to delete later, because nothing stored belongs to one phone. The notice says so.

**What counts cannot answer:** how one learner changes over time, or whether a missed question was later put right by the same learner. "Where they quit" is answered per level, as rounds left early. Per-learner analysis would need the full design above and a lawyer's or the NPC's answer first.

**Open points:** someone could send fake reports, so the server caps each number and limits how often a connection can report, without storing the address. A lawyer can confirm the anonymity reading when convenient; it is question 3 in the list below.

## What the app would collect

Abante Minds would send practice events, only after a learner and a guardian opt in, under a random ID that no name list contains. This is the design the owner confirmed on 20 October 2026. Every finding below is measured against it.

**Who:** Grade 6 learners preparing for the PSHS National Competitive Examination, usually 11 to 12 years old, so minors under Philippine law. The app is free, works offline, needs no account, and is hosted on GitHub Pages.

**Consent:** sharing is off by default. Turning it on needs the learner's yes and a ticked box saying a parent or guardian agrees. Learners already using the app are asked once, and "Not now" keeps sharing off.

**Identifier:** each learner who opts in gets a long random sharing ID. It is never shown, never written on a class list, and is not the learner's AM code. The AM code stays on the phone for a future research export, which the learner would hand straight to a researcher.

**What is sent:**

| Event | What it carries |
| --- | --- |
| Session start and end | Duration bucket, last screen, installed or in a browser, offline or online |
| Level started, round finished, level cleared, round left | Level id, score, first-try count, left early, shiny, question number |
| Question answered | Question type id, level id, right or wrong, attempt number, time bucket, hints used, mistake pattern id, difficulty step |
| Practice exam started, finished, left | Score per topic |
| Review and Basics results | Review interval (1, 3 or 7 days), fact id, right or wrong, time bucket |
| Feature use | Streak screen viewed, badge viewed, settings switched |
| Errors | Error codes only |

Every event also carries an event ID, the app version, a session ID, the date and hour, and its step number in the session.

**Not sent:** names, emails, school, free text, location, IP addresses (not stored), device fingerprints, or the AM code. There is no class code in the first version.

**Controls:** turning sharing off clears anything not yet sent, then asks whether to delete what was already sent. "Delete my data" sends a delete request with the sharing ID. If a phone is lost, its rows can no longer be tied to anyone, and they expire at the end of the retention period.

**Where it goes:** a server on Cloudflare (a Worker with a D1 database), compared with alternatives in the hosting section below. Nothing is deployed until the owner approves this memo.

## Philippine Data Privacy Act

**The DPA applies to Abante Minds in full.** The owner is the "personal information controller" and, as an individual, the de facto DPO. On the NPC's current approach the analytics would be sensitive personal information about minors. That brings parental consent, probable registration, a CPIA, breach rules, a written retention policy and two sets of notices.

Location does not change this. The rules reach processing abroad where the controller "is found or established in the Philippines" ([IRR Sec. 4](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/)). They also reach processing of data about Philippine residents. The NPC confirms its children's advisory also reaches processing abroad ([NPC FAQ on Advisory 2024-03, Q4](https://privacy.gov.ph/wp-content/uploads/2024/12/FAQs-Advisory-on-Guidelines-on-Child-Oriented-Transparency.pdf)).

### The hidden sharing ID is probably still personal data

**Most likely yes.** The DPA covers information that "when put together with other information would directly and certainly identify an individual" ([DPA Sec. 3(g)](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html)). The NPC says pseudonymisation alone "will not result in an anonymous dataset" ([AO 2018-029](https://privacy.gov.ph/wp-content/uploads/2022/01/AdOpNo.2018-029.pdf)).

Only data anonymised "in its truest sense" falls outside the Act. The NPC tests this by singling out, linkability and inference ([AO 2017-027](https://privacy.gov.ph/wp-content/uploads/2022/01/NPC_AdvisoryOpinionNo._2017-027.pdf)). Anonymisation must be irreversible, with no way to connect two records ([AO 2021-001](https://privacy.gov.ph/wp-content/uploads/2022/01/Redacted-Advisory-Opinion-No.-2021-001.pdf)). The sharing ID links one learner's events over time, and delete-by-ID proves records can be singled out. The server also sees IP addresses in transit.

**Uncertainty, flagged.** The statute's "directly and certainly" wording is narrower than the GDPR's. The owner holds no name list, which supports a textual argument that no one is identifiable. AO 2018-029 involved a controller that held identities, so it does not settle this case. No NPC opinion addresses device-generated random IDs.

The one clear way out is aggregation. Statistics that cannot single out a learner, with the per-ID stream discarded, would plausibly be anonymous. Aggregation does not help if raw per-ID rows are kept ([AO 2017-027](https://privacy.gov.ph/wp-content/uploads/2022/01/NPC_AdvisoryOpinionNo._2017-027.pdf)).

### Learning events are probably sensitive personal information

**If the data is personal, it is very probably sensitive.** Sensitive personal information (SPI) includes data "about an individual's ... education" ([DPA Sec. 3(l)(2)](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html)). The NPC treats "test scores" and "grade level" as SPI ([AO 2020-046](https://privacy.gov.ph/wp-content/uploads/2022/01/Redacted-Advisory-Opinion-No.-2020-046.pdf)). It treats quizzes and examinations the same way ([AO 2025-017, 26 Dec 2025](https://privacy.gov.ph/wp-content/uploads/2026/01/NPC-Advisory-Opinion-No.-2025-017_Redactedv2.pdf)). Right or wrong, mistake pattern, hints, level and difficulty step all read as education data.

This has four consequences:

- **Consent is the only workable basis.** DPA Sec. 13 prohibits SPI processing except listed cases. Legitimate interest "is absent in Section 13" ([AO 2020-046](https://privacy.gov.ph/wp-content/uploads/2022/01/Redacted-Advisory-Opinion-No.-2020-046.pdf)).
- **The 1,000-person registration trigger applies** once 1,000 learners opt in.
- **Breach notification rules engage**, because they hinge on SPI.
- **Criminal penalty ranges roughly double** (see the penalties table).

Purely technical telemetry (error codes, app version, offline flags) might rest on legitimate interest instead. No source confirms this, so keep it under the same consent until counsel advises.

### Consent should come from a parent, not a child's tick

**Philippine law sets no age of digital consent.** The NPC says setting one "will require legislative action through a law passed by Congress" ([NPC FAQ, Q6](https://privacy.gov.ph/wp-content/uploads/2024/12/FAQs-Advisory-on-Guidelines-on-Child-Oriented-Transparency.pdf)). Majority starts at 18 ([RA 6809](https://www.lawphil.net/statutes/repacts/ra1989/ra_6809_1989.html)). Unemancipated minors "cannot give consent to a contract" ([Civil Code Art. 1327](https://lawphil.net/statutes/repacts/ra1949/ra_386_1949.html)). A 2022 bill proposed a digital age of consent of "more than fifteen (15) years," but no amendment has passed ([HB 898, Digital Policy Alert](https://digitalpolicyalert.org/event/23343-introduced-amendments-to-the-data-privacy-act-of-2012-hb-no-898-including-data-protection-regulation)).

The Consent Circular never mentions minors. It lets a controller "acquire consent from a data subject's lawful representative" ([Circular 2023-04 §12](https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf)). NPC opinions say consent should come from "parents, in case of minor students" ([AO 2020-046](https://privacy.gov.ph/wp-content/uploads/2022/01/Redacted-Advisory-Opinion-No.-2020-046.pdf)). A minor's rights are exercised "through his mother as his parent and legal guardian" ([AO 2025-017](https://privacy.gov.ph/wp-content/uploads/2026/01/NPC-Advisory-Opinion-No.-2025-017_Redactedv2.pdf)).

**How the current design measures up against Circular 2023-04:**

| Requirement | Current design | Gap |
| --- | --- | --- |
| Freely given, no pressure (§7) | Off by default, asked once | None, if "Not now" is equally easy and no mascot nudges |
| Granular, not bundled (§8) | Separate opt-in | "Research later" is bundled into one yes |
| Informed, in the audience's language (§9) | English first | Parent notice and Filipino version missing |
| Clear assenting act; "Consent can never be assumed" (§10) | Learner taps yes | The act comes from the child, not the parent |
| Provable "with sufficient evidence" (§12) | Child-ticked box | Nothing shows the parent saw the notice |
| Withdrawal "as easy as" giving it, then delete (§13) | Off switch; asks whether to delete | Deletion should follow automatically |

The NPC's children's advisory makes parental involvement a CPIA factor. Controllers "must determine the appropriate methods for securing and verifying this involvement based on the level of risk." It also warns that "relying solely on users' self-declaration may be inadequate for high-risk processing" ([Advisory 2024-03 §2](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf)). The FAQ adds that the advisory itself does not make parental consent mandatory ([FAQ Q13](https://privacy.gov.ph/wp-content/uploads/2024/12/FAQs-Advisory-on-Guidelines-on-Child-Oriented-Transparency.pdf)). Consent law and NPC opinions still point to the parent.

**Proportionality cuts the other way too.** Proving consent "should not in itself lead to additional or excessive personal data processing" ([Circular 2023-04 §12(A)](https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf)). Collecting parent emails or IDs would undo the app's minimisation. A defensible middle path is a parent hand-off step on the device, recorded without identity, and justified in the CPIA. No NPC text approves or rejects that approach.

The design already matches several NPC rules. Children's settings must be "set to the highest level by default" ([Advisory 2024-03 §2(B)(2)(a)](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf)). Privacy engineering guidance names "unchecked consent boxes" as good practice ([Advisory 2025-02 §4](https://privacy.gov.ph/wp-content/uploads/2025/12/NPC_Advisory2025-02.pdf)). Do not use a character "that children know and trust" to encourage sharing ([Advisory 2024-03 §3(E)](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf)).

One more point needs counsel. Consent "must be time-bound in relation to the declared ... purpose" ([IRR Sec. 19(a)(1)](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/)). That may imply periodic re-consent, but no source says how often.

### Registration is probably mandatory

**Probably yes, on more than one ground.** Registration is mandatory for anyone "processing sensitive personal information of one thousand (1,000) or more individuals." It is also mandatory for processing "that will likely pose a risk to the rights and freedoms of data subjects." Systems involving "profiling shall, in all instances, be registered" ([Circular 2022-04 §5](https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04-2.pdf)). The 250-employee threshold is irrelevant because the triggers are alternatives.

Minors count as risk. The exemption form asks the declarant to swear the controller processes no data of "vulnerable data subjects like minors" ([Annex 1](https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04-Annex-1-1.pdf)). Abante Minds could not truthfully swear that. Profiling means processing to "evaluate, analyze, or predict" performance (§2(L)). Server-side analysis of one learner's mistake patterns could fit. Product-level aggregates may not.

| Item | Rule | Source |
| --- | --- | --- |
| Deadline | Within 20 days of the system starting | Circular 2022-04 §7 |
| Channel | Online only; physical filing "is not allowed" | §9 |
| Documents | Notarised application; sole proprietors add a DTI certificate and business permit | §11 |
| Contents | Legal basis, data subjects, security, retention, transfers abroad | §12(B) |
| Validity | One year; renew within 30 days before expiry | §§14, 18 |
| Fee, individual | ₱500 initial; ₱350 renewal | [Circular 2023-01](https://privacy.gov.ph/wp-content/uploads/2023/05/Schedule-of-Fees-and-Charges-of-the-National-Privacy-Commission.pdf) |
| Seal | Display the Seal of Registration on the main website | §§29-32 |
| Fine for failing | ₱50,000-₱200,000 | [Circular 2022-01](https://privacy.gov.ph/wp-content/uploads/2022/08/NPC-CIRCULAR-NO.-2022-01-GUIDELINES-ON-ADMINISTRATIVE-FINES-dated-08-AUGUST-2022-w-SGD.pdf) |

**Uncertainty, flagged.** The forms fit companies, sole proprietors and paid "Individual Professionals." An unpaid individual with no DTI registration fits none of them neatly. Whether the NPC accepts such a registrant is unconfirmed. How the NPC counts "1,000 individuals" from pseudonymous IDs is also unconfirmed.

Enforcement on children's platforms is active. In September 2026 the NPC reportedly issued show-cause orders to Meta, Roblox, Reddit and Discord over registration non-compliance ([Context.ph](https://context.ph/2026/09/22/npc-tightens-scrutiny-of-digital-platforms-over-childrens-data/)). That report is secondary and was not read in full.

### The owner is the Data Protection Officer

**Yes, a DPO is required, and it is the owner.** "An individual PIC or PIP shall be a de facto DPO" ([NPC Advisory 2017-01](https://privacy.gov.ph/wp-content/uploads/2022/01/NPC-Advisory-2017-01-sgd.pdf)). Every processor of personal data must designate an accountable person ([IRR Sec. 26(a)](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/)). The DPO must be named in the consent notice ([Circular 2023-04 §2](https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf)). A registrant needs a dedicated DPO email, distinct from personal email ([Circular 2022-04 §8](https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04-2.pdf)). The planned personal Gmail contact should therefore change.

### Breaches must be reported within 72 hours

**Yes, if three conditions meet.** Notify the NPC and affected people within 72 hours ([NPC Circular 16-03](https://privacy.gov.ph/wp-content/uploads/2022/01/sgd-npc-circular-16-03-personal-data-breach-management.pdf)). The conditions are: SPI is involved; an unauthorised person likely acquired it; and there is "a real risk of serious harm." Circular 16-03 is still in force. There must be "no delay" if 100 or more people are affected (§17(C)). A full report is due within 5 days. Every incident, notifiable or not, goes in a log and an annual summary (§22).

For children, "PICs shall notify both the children and their parents or guardians" in language children understand ([Advisory 2024-03 §4](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf)). Abante Minds holds no contact details, so direct notice is impossible. The realistic route is a request to use "alternative means" under §18(B), such as an in-app and public notice. A 2026 advisory says a controller "shall not simultaneously avail of" exemption and alternative means ([NPC Advisory 2026-02](https://privacy.gov.ph/wp-content/uploads/2026/05/Advisory-Clarification-on-the-Submission-of-Personal-Data-Breach-Notification-through-DBNMS_11-May-2026.pdf)). It also says NPC "inaction shall not be construed as an approval." Concealing a breach of SPI carries 1.5-5 years and ₱500,000-₱1,000,000 ([DPA Sec. 30](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html)).

### Retention must be fixed, stated and short

**The law sets principles, not numbers.** Keep data "only for as long as necessary" for the declared purpose ([DPA Sec. 11(e)](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html)). Data "shall not be retained in perpetuity in contemplation of a possible future use yet to be determined" ([IRR Sec. 19(e)](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/)). Aggregated or non-identifying data "may be kept longer." The controller "should establish and document retention periods in a policy" and tell data subjects ([Circular 2023-06 §9](https://privacy.gov.ph/wp-content/uploads/2024/03/NPC-Circular-Repeal-16-01-Signed.pdf)). The consent statement must give the "duration" of processing ([Circular 2023-04 §3(A)](https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf)).

"Research later" is not a declared, specified purpose. Keeping data for a possible future study conflicts with IRR Sec. 19(e). The research exemption is narrow. It requires "public benefit" and ethics compliance, and still carries security and rights duties ([IRR Sec. 5(c)](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/); [AO 2020-029](https://privacy.gov.ph/wp-content/uploads/2022/01/Redacted-Advisory-Opinion-No.-2020-029.pdf)). A specific proposal is in Recommendations.

### Rights work through the sharing ID, with one gap

**Delete-by-ID fits NPC guidance, but lost IDs have no clear answer.** Data subjects have rights to be informed, access, object, correct, erase or block, port and claim damages ([DPA Secs. 16-18](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html)). Parents exercise them for minors. Identity checks must be limited "to the extent necessary" ([NPC Advisory 2021-01](https://privacy.gov.ph/wp-content/uploads/2026/05/SGD-Advisory-DS-Rights-29-Jan-2021.pdf)). Requests are due within 30 working days, extendable by 15. Erasure covers "both live and back-up systems." Portability covers observed data, in formats like "XML, JSON, CSV."

Withdrawal should use the same interface as consent ([Circular 2023-04 §13(B)](https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf)). The in-app delete button meets that. Possession of the secret ID is a proportionate verification factor. **The gap:** the Philippines has no equivalent of GDPR Art. 11 for controllers who cannot identify a requester. A parent who lost the phone cannot be helped without collecting more data. Say so in the notice, and keep retention short to limit orphaned rows.

### Two notices are needed: one for the child, one for the parent

**A child-friendly notice and a standard notice are both required.** "PICs must provide child-friendly Privacy Notices in addition to standard versions" ([Advisory 2024-03 §3(B)](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf)). Notices must be just-in-time, layered and free of "technical jargon" ([Circular 2023-04 §3](https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf)). They must be in "a language or dialect that an average member of the target audience can understand" (§3(E)). Insufficient information "may render the consent given invalid" (§3(F)).

The DPA lists the core contents ([Sec. 16(b)](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html)). The children's advisory adds "Potential consequences and risks," the "Importance of privacy settings," rights and revisions. No form is prescribed ([FAQ Q16](https://privacy.gov.ph/wp-content/uploads/2024/12/FAQs-Advisory-on-Guidelines-on-Child-Oriented-Transparency.pdf)). **English-first is a flagged risk.** Whether an English-only notice suffices at launch depends on the audience, and counsel should confirm it.

### Penalties fall on the owner personally

**An individual has no corporate shield.** The main risk is a finding that processing lacked valid consent, which is "unauthorized processing" (Sec. 25). Maximum penalties apply when "at least one hundred (100) persons" are affected (Sec. 35).

| Offence (DPA section) | Ordinary personal information | Sensitive personal information |
| --- | --- | --- |
| Unauthorised processing (25) | 1-3 years; ₱500,000-₱2,000,000 | 3-6 years; ₱500,000-₱4,000,000 |
| Access due to negligence (26) | Same as Sec. 25 | Same as Sec. 25 |
| Improper disposal (27) | 6 months-2 years; ₱100,000-₱500,000 | 1-3 years; ₱100,000-₱1,000,000 |
| Unauthorised purposes (28) | 1.5-5 years; ₱500,000-₱1,000,000 | 2-7 years; ₱500,000-₱2,000,000 |
| Concealing a breach (30) | Not applicable | 1.5-5 years; ₱500,000-₱1,000,000 |
| Unauthorised disclosure (32) | 1-3 years; ₱500,000-₱1,000,000 | 3-5 years; ₱500,000-₱2,000,000 |
| Combination of acts (33) | 3-6 years; ₱1,000,000-₱5,000,000 | Same |

Source: [RA 10173](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html).

Administrative fines are separate ([Circular 2022-01](https://privacy.gov.ph/wp-content/uploads/2022/08/NPC-CIRCULAR-NO.-2022-01-GUIDELINES-ON-ADMINISTRATIVE-FINES-dated-08-AUGUST-2022-w-SGD.pdf)). "Grave" infractions cost 0.5%-3% of the prior year's gross income, for breaches affecting over 1,000 people. "Major" infractions cost 0.25%-2%, including failure to notify a breach. Fines are capped at ₱5,000,000 per act. A free app may have little income, so percentage fines could be small. Fixed fines of ₱50,000-₱200,000 for registration failures do not depend on income. The NPC can also order processing to stop ([IRR Sec. 65](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/)).

## DepEd and research ethics

**DepEd rules probably do not apply to home use.** They start to apply when schools, class time, school records or teachers become part of data collection. Any thesis or publication using the data triggers ethics review under the national research ethics guidelines. That review expects parental consent plus the child's own assent.

### When DepEd rules apply

DepEd's research policy is DepEd Order (DO) 16, s. 2017, amended by DO 26, s. 2021 ([DO 16 s. 2017](https://www.deped.gov.ph/wp-content/uploads/2017/03/DO_s2017_016.pdf); [DepEd PPRD](https://sites.google.com/deped.gov.ph/pprd/legal-bases)). No 2023-2026 replacement was found. It governs "research initiatives at the national, regional, schools division, and school levels." No source says it covers a private developer's opt-in analytics from family phones at home. That boundary is inferred and should be confirmed with a Schools Division Office.

No source confirms that DepEd ever created the research ethics committee DO 16 promised. A 2022 regional memo says "There is no sufficient policy ensuring research ethics in the Department" ([DepEd RO VIII OM 494 s. 2022](https://region8.deped.gov.ph/wp-content/uploads/2022/09/OM-s2022-494.pdf)). In practice, Region III demands a university ethics approval instead.

Schools have their own privacy guidance. The Data Privacy Council's education advisory says tools with no formal school relationship "should be limited." It recommends a privacy impact assessment before use ([DPC Education Sector Advisory 2020-1](https://privacy.gov.ph/wp-content/uploads/2023/05/DP-Council-Education-Sector-Advisory-No.-2020-1.pdf)). DO 006, s. 2026 (24 March 2026) bans phones during instructional periods, except teacher-authorised use of an "approved educational platform" ([DepEdClub explainer](https://depedclub.com/deped-order-006-2026-esmle-cellphone-rules-school-safety/)). The order's official text was not read, so who "approves" a platform is unknown.

### Approval levels

The level is the lowest DepEd office covering every site. This pattern comes from DO 16 and regional practice, not one national rule ([DO 16 s. 2017](https://www.deped.gov.ph/wp-content/uploads/2017/03/DO_s2017_016.pdf); [DepEd Region III](https://region3.deped.gov.ph/services/request-to-conduct-study/)).

| Where the study runs | Who approves |
| --- | --- |
| One public school | School head, usually plus a Schools Division Office (SDO) permit |
| One division, two or more schools | SDO research committee, signed by the Schools Division Superintendent |
| Two or more divisions in one region | Regional Office research committee and Regional Director |
| Two or more regions | Central Office National Research Committee |
| A private school | That school and its DPO (confirm with the supervising SDO) |
| PSHS students or NCE data | PSHS System or campus and the PSHS DPO; DepEd rules do not govern PSHS |

PSHS is a DOST-attached school under RA 8496, as amended by RA 9036 ([PSHS privacy notice](https://pshs.edu.ph/privacy-policy/)). No public PSHS rule for outside researchers was found. Region III's checklist is a useful model. It asks for university endorsement, ethics approval, the instrument, consent forms and an "Assent Form (in case the study involves learners below 18 years old)." It also wants a written plan for data storage, transfer, destruction and breaches ([DepEd Region III](https://region3.deped.gov.ph/services/request-to-conduct-study/)).

### PHREB consent and assent

The 2022 National Ethical Guidelines for Research Involving Human Participants (NEGRIHP) cover social, behavioural and internet research ([2022 NEGRIHP](https://www.pchrd.dost.gov.ph/wp-content/uploads/2023/05/2022-NEGRIHP_Official-Gazatte_Ver-5-1.pdf)). For minors, "the consent of the parent or guardian must be obtained as well as the assent of the minor." Assent must be "documented and witnessed by a third party."

| Child's age | Assent required |
| --- | --- |
| Under 7 | None |
| 7 to under 12 | Verbal assent |
| 12 to under 15 | Simplified written assent |
| 15 to under 18 | Minor co-signs the parent's consent |

Grade 6 learners straddle two bands. A child who turns 12 mid-study should sign an assent form. "The child's dissent should be upheld and respected."

Internet research with minors faces extra rules. It "should be limited to minimal risk research." Websites aimed at children "must require that the parent's consent be obtained first." Researchers must "validate the parental consent by following up with an email, letter, or phone call." IP addresses "are potentially identifiable." Only an ethics committee can declare a study exempt ([UPLB REB FAQ](https://reb.uplb.edu.ph/wp-content/uploads/2024/04/2024-04-Research-Ethics-FAQs-and-2022-NEGRIHP.docx.pdf)). A re-identifiable code does not meet the anonymous-survey exemption. At least one UP committee routes studies of under-18s to expedited or full review ([UP CHE REC](https://sites.google.com/up.edu.ph/upcherec/faqs)).

**Uncertainty, flagged.** NEGRIHP binds researchers through their institution's ethics committee. Whether it binds a lone developer outside any institution is unsettled.

### What would trigger DepEd or ethics review

**DepEd permit (SDO, Regional or Central Office, by spread):**

- Recruiting through public schools, such as teachers handing out consent forms or announcing a study in class.
- Collecting data during class time or on school premises.
- Requesting class lists, Learner Reference Numbers, grades or other school records, or linking app data to them.
- Using DepEd teachers as data collectors.
- Describing a study as done "with" a named school or division.
- A teacher-researcher studying their own class, which also uses the DO 16 committee track.

**Ethics review:**

- Any plan to publish, present or write a thesis from the data, including retrospective analysis of past analytics.
- Reusing analytics for research. Committees want proof the original consent covered research, fresh consent, or an approved waiver ([2022 NEGRIHP](https://www.pchrd.dost.gov.ph/wp-content/uploads/2023/05/2022-NEGRIHP_Official-Gazatte_Ver-5-1.pdf)).

A study linking practice to NCE success should collect results from families with consent. PSHS is unlikely to release applicant results to a third party.

### Teachers recommending the app

**A teacher may recommend a free app, within limits.** Nothing found prohibits it. DepEd issues "no endorsements or accreditation," and restricts its name and logo to public purposes ([DO 28 s. 2001, TeacherPH copy](https://www.teacherph.com/prohibition-commercialization-decs-organization-endorsements-accreditation-goods-services/)). DepEd specifically disclaimed endorsing review classes for the old High School Readiness Test ([DO 18 s. 2004](https://deped.gov.ph/?p=7145)). Schools may not collect contributions from learners in any form ([DepEd, 6 Aug 2024](https://www.deped.gov.ph/2024/08/06/deped-reminds-schools-to-adhere-to-no-collection-policy/)).

The practical rules follow. The app should carry no DepEd or PSHS logos and no "recommended by DepEd" wording. A teacher's recommendation must stay optional and ungraded. Teachers should not enter learner data into the app. No school should be named as a partner without a written agreement.

## Cross-border transfer and hosting

**Philippine law allows foreign servers.** It requires no local storage and no prior approval. "The DPA is not a barrier to cross-border transfers of personal data" ([NPC Advisory 2024-01](https://privacy.gov.ph/wp-content/uploads/2024/06/Published-NPC-Advisory-No.-2024-01-Contractual-Clauses-for-Cross-Border-Transfers_30May24.pdf)). The owner stays accountable for what the host does. **Cloudflare Workers + D1 remains the best fit**, with specific configuration.

### What the law requires

The controller is responsible for data "transferred to a third party for processing, whether domestically or internationally" ([DPA Sec. 21](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html)). It must use "contractual or other reasonable means to provide a comparable level of protection." The NPC confirms the law does "not prohibit the transmission and processing of personal data outside the country" ([AO 2017-012](https://privacy.gov.ph/wp-content/uploads/2022/01/NPC_AdvisoryOpinionNo._2017-012.pdf)).

Processing by a processor "shall be governed by a contract or other legal act" ([IRR Sec. 44](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/)). The contract must state subject matter, duration, purpose, data types and "the geographic location of the processing." The processor must agree to nine terms. These include acting only on instructions, confidentiality, security, sub-processor control, help with rights requests, and deletion at the end. Model clauses (ASEAN, EU and others) are "for voluntary adoption" ([Advisory 2024-01 §6](https://privacy.gov.ph/wp-content/uploads/2024/06/Published-NPC-Advisory-No.-2024-01-Contractual-Clauses-for-Cross-Border-Transfers_30May24.pdf)). Registration must state transfers outside the Philippines ([Circular 2022-04 §12(B)](https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04-2.pdf)). The notice must name recipients ([DPA Sec. 16(b)](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html)).

### Hosting options compared

| Factor | Cloudflare Workers + D1 | Supabase (Singapore) | Google Apps Script + Sheets | Philippine-hosted server |
| --- | --- | --- | --- | --- |
| Where data sits | `apac` hint, "not a guarantee"; only enforceable jurisdictions are `eu`, `fedramp`, `us` ([D1 docs](https://developers.cloudflare.com/d1/configuration/data-location/)) | Specific AWS region ap-southeast-1 ([Supabase regions](https://supabase.com/docs/guides/platform/regions)) | No published location for consumer accounts; paid Workspace regions are US or Europe only ([Google](https://knowledge.workspace.google.com/admin/compliance/choose-a-geographic-location-for-your-data?hl=en)) | In-country; Alibaba Cloud lists Manila (ap-southeast-6) ([Alibaba Cloud](https://www.alibabacloud.com/help/en/asc/developer-reference/api-aisc-2026-01-01-endpoint)) |
| Processor contract | DPA v6.4 (3 Apr 2026), incorporated; Self-Serve §6.1 frames it around European and CCPA data ([Cloudflare DPA](https://www.cloudflare.com/cloudflare-customer-dpa/); [terms](https://www.cloudflare.com/terms/)) | DPA v1 (1 Aug 2026), incorporated, covers "all applicable laws" ([Supabase DPA](https://supabase.com/legal/dpa)) | None found for consumer accounts | Depends on provider; often minimal |
| Children-specific terms | None in agreement or DPA; privacy policy says services are not for under-18s ([Cloudflare privacy](https://www.cloudflare.com/privacypolicy/)) | None | None ([Apps Script terms](https://developers.google.com/apps-script/terms)) | Unknown |
| Cost at pilot scale | Free: 100,000 requests/day, 100,000 rows written/day, 500 MB per database; Paid $5/month, 10 GB ([Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/); [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)) | Free 500 MB; Pro from $25/month ([Supabase pricing](https://supabase.com/pricing)) | $0; 30 simultaneous executions per user ([quotas](https://developers.google.com/apps-script/guides/services/quotas)) | VPS cost plus owner's time; not verified |
| Backups | 7-day point-in-time recovery (Free), 30-day (Paid) | Free: none, pauses after 1 week inactive; Pro: daily, kept 7 days | Sheet only; quotas change "without notice" | Self-managed |
| Keeping IPs out | Do not store `CF-Connecting-IP`; turn off invocation logs | Logging controls not researched | Not researched | Full control, full responsibility |
| Suspension terms | May terminate "for any reason or no reason at all" | May suspend on suspected illegality | "May suspend" without notice | Provider-dependent |
| Overall fit | Best balance | Best location certainty; costly and fragile on Free | Weakest | Legally tidy; riskiest to run alone |

No major cloud provider has a Philippine region as of October 2026. AWS has only a proposed investment ([Newsbytes.PH, 8 Jul 2026](https://newsbytes.ph/2026/07/08/marcos-jr-meets-aws-execs-over-proposed-5-b-cloud-investment-in-ph/)). A self-run local server adds patching and security duties the NPC's security circular expects ([Circular 2023-06](https://privacy.gov.ph/wp-content/uploads/2024/03/NPC-Circular-Repeal-16-01-Signed.pdf)). For one owner, that likely raises net risk.

### Recommended Cloudflare setup

Create D1 with the `apac` location hint and do not enable read replication. Replication creates replicas "in every available region" ([D1 docs](https://developers.cloudflare.com/d1/configuration/data-location/)). Set `invocation_logs = false`, because "Observability is enabled by default for all newly created Workers" ([Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)). Never read or store `CF-Connecting-IP`, user agent or `request.cf` geodata. Key rate limits on the sharing ID, as Cloudflare advises against keying on IPs ([Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)). Add a payload size cap and schema validation, and allow CORS only from the Pages origin.

A rough estimate shows capacity limits. At 500 learners sending 40 events a day, storage grows about 6 MB daily. The 500 MB Free cap would fill in roughly 80 days. That figure is an estimate, not a vendor number. Scheduled deletion or a move to the $5 plan solves it.

**Uncertainty, flagged.** Cloudflare does not say which cities serve `apac` databases. Whether a non-guaranteed hint satisfies IRR Sec. 44's "geographic location" element is unconfirmed. Describe it honestly: "stored by Cloudflare, mainly in the Asia-Pacific region; exact location not guaranteed."

## Platform terms

**No platform term reviewed bans an opt-in children's analytics backend.** The PWA's takedown risks are generic and low. The bigger practical risk is an NPC complaint over notice or consent. The binding platform rules arrive with a native app, through Google Play's Families Policy and Apple's Kids rules.

| Platform | When it applies | Rules that matter | Removal or rejection triggers | Risk for Abante Minds |
| --- | --- | --- | --- | --- |
| GitHub Pages | Now (PWA host) | Not for "online business," e-commerce or SaaS; 1 GB site; 100 GB/month soft bandwidth; "Misuse of personal information is prohibited" | Commercial use; excess bandwidth | Low now; high if Pro is sold from Pages |
| Cloudflare | Now (analytics backend) | No child clause; no quota circumvention | No-cause termination; multiple accounts to dodge limits | Low |
| Google Play Families | Future Android app | Ages 9-12 group triggers Families Policy; no AAID or hardware IDs; approved SDKs only; accurate Data safety form; "no app that is merely a webview of a website" | Misdeclared audience; banned identifiers; non-certified SDKs; Data safety errors; manipulative monetisation | Medium; manageable with first-party analytics |
| Apple App Store Kids | Future iOS app | Kids bands 5 and under, 6-8, 9-11; no third-party analytics or ads, narrow exceptions; parental gate on links and purchases | Third-party SDKs; ungated links or paywalls; "For Kids" wording outside Kids Category | Medium to high if ads are planned |

Sources: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits); [GitHub additional terms](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features); [GitHub AUP](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies); [Cloudflare terms](https://www.cloudflare.com/terms/); [Google Play Families Policy](https://support.google.com/googleplay/android-developer/answer/9893335); [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/); [Apple Kids](https://developer.apple.com/kids/).

**GitHub Pages.** Pages is "primarily ... a showcase for personal and organizational projects" ([GitHub terms](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features)). Posting analytics to a separate server is not addressed, so not prohibited. GitHub's under-13 statement covers its own services, not obviously Pages visitors ([GitHub privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)). GitHub keeps visitor IPs for an unpublished period. It should be listed as a recipient.

**Cloudflare.** The self-serve agreement has no clause on children, minors or COPPA. Its privacy policy says Cloudflare's services are not "designed to attract, individuals under the age of eighteen." Whether that reaches end users of customer apps is unclear ([Cloudflare privacy](https://www.cloudflare.com/privacypolicy/)).

**Google Play.** Google judges the audience from imagery and wording, whatever is declared. "Misrepresentation ... may result in removal or suspension" ([Families Policy](https://support.google.com/googleplay/android-developer/answer/9893335)). Child-only apps "should not request the AD\_ID permission" when targeting API 33 or higher. Google's guidance says "do not collect persistent identifiers from children." A random first-party ID is not on the banned list, but no safe harbour exists. Opt-in data still counts as "collected" on the Data safety form ([Data safety help](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)). The webview rule means the native app cannot simply wrap the PWA.

**Apple.** Kids Category apps "should not include third-party analytics or third-party advertising" ([Guideline 1.3](https://developer.apple.com/app-store/review/guidelines/)). First-party analytics on the owner's backend is not banned, but must appear on the privacy label. Apple requires disclosure even for data collected only from users who opt in ([App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)). Kids obligations persist "even if you decide to deselect the category." Learners aged 12 sit just above the 9-11 band, but 5.1.4 still covers apps "intended primarily for kids."

**US state laws.** Texas's app store law has applied to new Apple accounts in Texas since 4 June 2026 ([Apple Developer News](https://developer.apple.com/news/?id=sg176nne)). Utah's amendments treat new in-app purchases or ads as "significant" changes ([Wiley Rein](https://www.wiley.law/alert-Key-Developments-With-State-App-Store-Accountability-Acts-as-Texas-Act-Takes-Effect)). Utah and Louisiana dates moved to 2027, which conflicts with an older Apple notice. These apply only with US distribution, so limit the native app to the Philippine storefront.

## COPPA and GDPR-K

**Probably neither applies.** Both turn on targeting the US or the EU, and Abante Minds targets the Philippines. Each keeps a small residual hook. Limiting analytics to the Philippines closes most of it.

| Law | Reaches Abante Minds? | Remaining hook | What it would require |
| --- | --- | --- | --- |
| COPPA (US) | Probably not | "Directed to children in the United States" is untested for a reachable foreign app; "commercial purposes" undefined | Internal-operations exception (no parental consent); online notice; written retention policy; written security programme |
| GDPR Art. 8 (EU) | Probably not | Art. 3(2)(b) "monitoring" of users while in the EU | Parent consent below 13-16, with "reasonable efforts" to verify; possible EU representative |
| UK Children's Code | Probably not | Same monitoring hook | 15 standards, including high-privacy defaults |

### COPPA

Foreign services must comply if "directed to children in the United States" or if they knowingly collect from US children ([FTC COPPA FAQ B.7](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)). Abante Minds is plainly child-directed. Pesos, Filipino names, PSHS content and no US marketing point to Philippine children instead. COPPA also covers only services "operated for commercial purposes" ([final rule, 90 FR, 22 Apr 2025](https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm)). A free, ad-free individual project is not clearly inside or outside. Ads or Pro would weaken that argument sharply. Foreign enforcement exists: the FTC acted against toy maker Apitor in September 2025 ([FTC](https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-takes-action-against-robot-toy-maker-allowing-collection-childrens-data-without-parental-consent)). Both foreign cases found involved US sales or marketing.

If COPPA did apply, the analytics would likely fit an exception. A persistent identifier is personal information. Collecting one "and no other personal information," solely for internal operations, needs no parental consent ([§312.5(c)(7)](https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm)). The 2025 amendments took effect 23 June 2025, with compliance due 22 April 2026. They add three duties even under that exception:

- an online notice of "the specific internal operations" the identifier supports (§312.4(d)(3));
- a written retention policy, because data "may not be retained indefinitely" (§312.10);
- a written security programme, reviewed "at least annually" (§312.8).

**Two open points.** Per-question learning data tied to the ID might count as "other personal information," which would defeat the exception. A checkbox is also not among the FTC's listed methods of "verifiable parental consent" ([§312.5(b)(2)](https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm)). Do not describe the guardian box as COPPA consent.

### GDPR and the UK Children's Code

The GDPR reaches non-EU services only by intentional targeting or monitoring. "Mere accessibility" of a website "is insufficient" ([EDPB Guidelines 3/2018, quoting Recital 23](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_3_2018_territorial_scope_after_public_consultation_en_1.pdf)). The EDPB's examples of single-country news services fall outside it. The residual risk is "monitoring," which needs no intent but implies "a specific purpose." Per-learner tracking of EU-located children could be argued to fit.

If caught, consent under 16 (or a national age down to 13) must come from a parent ([GDPR Art. 8](https://gdpr-info.eu/art-8-gdpr/)). The sharing ID would be personal data for the owner ([Recital 26](https://gdpr-info.eu/recitals/no-26/)). The 2025 SRB judgment helps only recipients without re-identification means ([CURIA, C-413/23 P](https://curia.europa.eu/jcms/jcms/p1_5127926/sv)). The UK Code uses the same gate ([ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/services-covered-by-this-code/)). Its standards remain good design benchmarks.

### Mitigations

- **Limit analytics to the Philippines.** Check country in memory from the request and discard the IP, or pre-filter by the Asia/Manila timezone. Drop events from elsewhere. This removes the EU "monitoring" and COPPA "knowing" hooks. Filipino learners abroad lose analytics, not the app.
- **State the audience.** Say the app is designed for learners in the Philippines preparing for the PSHS NCE. This mirrors the EDPB's country-only examples.
- **Avoid foreign targeting signals**, such as US or EU ads, currencies or testimonials.
- **Keep payloads coarse** and use no third-party analytics or ad SDKs.
- **Describe the guardian step honestly** as transparency, not COPPA or GDPR consent.
- **Write the cheap documents anyway**: a retention policy, a one-page security programme and an internal-operations notice.

## The future full-scale app: ads, Pro and Duolingo Super

**A separate native app with subtle ads and a paid Pro tier is workable.** Philippine law has no child-specific ad statute, so the binding rules are the app stores' and general consumer law. A child's purchase can be annulled, so the parent must be the buyer. Duolingo Super sells no ads and unlimited practice, while keeping all lessons free.

### Philippine advertising and consumer rules

No Philippine statute regulates online advertising to children, sets an ad-targeting age, or bans dark patterns or loot boxes. General rules still apply:

| Rule | What it requires | Consequence |
| --- | --- | --- |
| ASC Code, "Protection of Children" (self-regulatory) | No exploiting children's "trust or credulity"; no misleading claims about a product's usefulness | Complaints and member sanctions ([ASC](https://asc.com.ph/our-standards/code-of-ethics/protection-of-children/)) |
| Consumer Act, RA 7394 Arts. 50, 52, 110 | No deceptive or unconscionable sales; no "false, deceptive or misleading advertisement" | Statutory penalties ([RA 7394](https://lawphil.net/statutes/repacts/ra1992/ra_7394_1992.html)) |
| Internet Transactions Act, RA 11967 Sec. 23 | E-retailers publish business name, physical address, phone and email; issue receipts; offer complaints redress | Online deceptive acts: ₱20,000-₱100,000 first offence, up to ₱500,000-₱1,000,000 for third ([RA 11967 Sec. 29](https://lawphil.net/statutes/repacts/ra2023/ra_11967_2023.html)) |
| NPC Advisory 2023-01 (deceptive design) | Consent gathered through dark patterns is invalid | Unlawful processing ([Advisory 2023-01](https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Advisory-No.-2023-01-Guidelines-on-Deceptive-Design-Patterns_7Nov23.pdf)) |

Claims like "pass PSHS with Pro," fake countdowns or untrue "today only" prices risk Arts. 50 and 110. Pressuring 11-12-year-olds is a plausible "unconscionable" argument under Art. 52, though untested for age. The ITA's implementing rules were not read, so they may add duties.

### Contracts with minors

**A child's Pro purchase is voidable.** Contracts with a party "incapable of giving consent" are "binding, unless they are annulled by a proper action in court" ([Civil Code Art. 1390](https://lawphil.net/statutes/repacts/ra1949/ra_386_1949.html)). For minors, the four-year annulment period runs from when guardianship ends (Art. 1391), usually age 18. The seller "cannot allege the incapacity" of the child (Art. 1397). The child returns only what actually benefited them (Art. 1399). A guardian can ratify (Art. 1394). A no-refund clause cannot defeat these rules. Make the parent the buyer, through parent-owned store accounts with purchase approval, behind a parental gate. Send renewal reminders to the parent.

### Store rules for ads and purchases

**Google Play** allows ads to children only through Families Self-Certified Ads SDKs, such as AdMob 19.0.0 or later ([certified list](https://support.google.com/googleplay/android-developer/answer/9859768)). The programme "is not currently accepting new applicants." Interest-based ads and remarketing are banned. Interstitials at launch, ad walls and multiple placements per page are prohibited ([Families Policy](https://support.google.com/googleplay/android-developer/answer/9893335)). Rewarded ads must be closable after 5 seconds. "Emotionally manipulative tactics" to drive ad views or purchases are banned, and IAP offers follow the same rules.

**Apple** effectively rules out mainstream ad networks in kids apps. Contextual ads are allowed only from services with documented practices "that include human review of ad creatives" ([Guideline 1.3](https://developer.apple.com/app-store/review/guidelines/)). Subscriptions must use in-app purchase (3.1.1). Ask to Buy is on by default and "can't be turned off if the child is under 18" ([Apple Support](https://support.apple.com/en-us/105055)). Tracking cannot be enabled for under-18 accounts, so the IDFA is unavailable ([Apple Support](https://support.apple.com/en-us/102420)). An ad-free iOS app with Pro may be the lower-risk path, even if Android carries ads.

### DepEd and the commercial app

DepEd bars favouring "one commercial product or service over another" ([DO 39 s. 2009](https://www.deped.gov.ph/?p=5257)). School signs may carry no commercial ads or endorsements ([DO 37 s. 2010](https://deped.gov.ph/?p=7508)). Public schools may not let "private commercial enterprises ... conduct educational surveys" and promote products ([DO 85 s. 1992](https://www.deped.gov.ph/?p=4239)). Requiring learners to pay for Pro would collide with the no-collection policy. Duolingo offers a precedent: Super "will not be available" to students in a Duolingo classroom ([Duolingo Help](https://www.duolingo.com/help/super-duolingo)). A teacher mode with no ads and no upsells fits DepEd culture.

**Keep the brands apart.** Promoting the future app inside Abante Minds would be advertising directed to children under the ASC Code. Selling Pro from GitHub Pages would breach its no-business rule. This bears on the plan for Abante Minds to sit inside the larger app as its NCE section: inside the paid app is fine, but the free PWA should not advertise the paid one.

### What Duolingo Super offers

| Tier | What it gives | Notes |
| --- | --- | --- |
| Free | "The same lesson content to all users," streaks, leaderboards, end-of-lesson mistake review | Limited by hearts or energy; ad-supported |
| Super | "No ads," "Unlimited Hearts," personalised mistake practice, "Unlimited attempts at Legendary challenges" | Unlimited Hearts "may be part of a test"; Video Call moving in during 2026 |
| Super Family | Super for "up to 6" accounts | Manager pays; under-13s invited by link |
| Max | Super plus AI Roleplay and Video Call | Mobile only; CEO: "we may actually sunset Max" |
| Super Lite (test) | "About half the price"; "twice as much energy," not unlimited | Whether it shows ads is unconfirmed |

Sources: [Duolingo Help: Super](https://www.duolingo.com/help/super-duolingo); [Super page](https://www.duolingo.com/super); [Family Plan](https://www.duolingo.com/help/family-plan); [Max](https://www.duolingo.com/help/what-is-duolingo-max); [Q2 2026 call transcript](https://www.webull.com/news/15392596720296960).

The Philippine App Store lists Super at ₱1,650, ₱1,900 and ₱2,390, with durations unlabelled ([App Store PH](https://apps.apple.com/ph/app/duolingo-language-lessons/id570060128)). They are probably annual prices, but that is unconfirmed. The web trial offers "1 week free," with a Day 5 reminder and a Day 7 charge. The CEO said most trials are moving to one month, with energy and ads off. Duolingo's terms say in-app charges are "nonrefundable" and that "Deleting the app ... does not cancel your subscription" ([Duolingo Help](https://www.duolingo.com/help)). Duolingo had 12.7 million paid subscribers at the end of Q2 2026. Ads earned US$21.1 million of US$298.5 million revenue, about 7% ([Q2 2026 letter](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm)). Duolingo is also entering K-12 math. Its CEO says its Math users are "mainly under 18" ([Q2 2026 call transcript](https://www.webull.com/news/15392596720296960)).

### How Duolingo treats children and ads

Duolingo's "Child Users" are under 13 in the US "or another age of digital consent in their country" ([Duolingo Privacy Policy, 26 May 2026](https://www.duolingo.com/privacy)). It collects no name, email or phone from them. For them, "Advertisements are non-personalized and set to family-safe content. Third-party behavioral tracking is disabled. Third-party analytics are disabled." All under-16s get non-personalised ads too. Adults get personalised ads through Unity, Meta, LiftOff, Pangle, Moloco and Google. The Philippines has no age of digital consent, so Duolingo's local threshold is unclear.

These protections cover privacy, not ad load. Children still see ads and rewarded-ad prompts, which refill energy ([Duolingo blog](https://blog.duolingo.com/duolingo-energy/)). A 2025 academic review found "excessive notifications and emotionally charged visuals" alongside good practices ([Castro and Valença, IHC 2025](https://sol.sbc.org.br/index.php/ihc/article/view/37677)). Duolingo itself now estimates "more than $50M of foregone bookings from friction" it chose to remove ([Q4 FY2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm)).

### What to borrow and what to avoid for Pro

**Borrow:**

- all lesson content free, with Pro selling extras such as no ads, extra challenge attempts and targeted mistake review;
- a parent-managed family plan;
- a trial with an advance reminder to the parent;
- Duolingo's Child User privacy treatment, as a floor rather than a ceiling.

**Avoid:**

- an energy cap relieved by ads or payment, which rations study for families who cannot pay;
- streak-loss guilt and guilt-based notifications;
- gem packs or other virtual currency for children;
- upsells aimed at the child rather than the parent.

Launch with the monetisation model already in place. Google recommends notifying existing users when ads or in-app purchases are added ([Families Policy](https://support.google.com/googleplay/android-developer/answer/9893335)). In the US, such a change can also require parental re-consent.

## Recommendations

**Fix the consent flow and the privacy contact first.** Then write the CPIA, set retention, configure hosting and publish the notices. Decide registration with counsel before the first event is sent. These are proposals for counsel to confirm, not legal advice. Two of them change choices made on 20 October: turning sharing off should delete sent data by default, and "research later" should become a separate yes.

### Proposed retention period

No Philippine rule sets a number, so these are design choices to document in the CPIA.

| Data | Proposed period | Reasoning |
| --- | --- | --- |
| Raw events under a sharing ID | **90 days**, then deleted by a scheduled job | See below |
| Aggregated statistics (no sharing ID; small groups suppressed) | Kept while useful; reviewed yearly | Non-identifying data "may be kept longer" ([IRR Sec. 19(e)](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/)) |
| Sent data after turn-off or a delete request | Removed from the live database within 7 days; gone from backups within 30 days | Erasure covers live and backup systems ([Advisory 2021-01](https://privacy.gov.ph/wp-content/uploads/2026/05/SGD-Advisory-DS-Rights-29-Jan-2021.pdf)); D1 recovery keeps 7 days (Free) or 30 days (Paid) |
| Unsent queue on the phone | Cleared at once on turn-off | Already in the design |
| Worker logs | Off; never longer than the 3-day Free log retention | [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) |
| Manual exports | Encrypted; replaced each cycle; never older than 30 days | Keeps backups inside the deletion promise |
| Consent records (time, notice version, language) | As long as the related data exists | Proof of consent ([Circular 2023-04 §12](https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf)) |

**Why 90 days for raw events.** Product improvement needs enough history to compare several releases and review cycles. It does not need years of per-learner rows. Google Play's Data safety form recognises automatic deletion or anonymisation "within 90 days" as a deletion practice ([Data safety help](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)). Lost-phone rows cannot be deleted on request, so a short window limits orphaned data. A smaller store also shrinks breach exposure. It fits the D1 capacity estimate if payloads stay small. If spaced-review analysis needs longer windows, extend to 180 days only with a written CPIA reason. Never extend retention for possible future research.

### Consent flow changes

1. **Learner screen.** Explain in child-level language what is sent, what is not, that it is optional, and how to stop. Give "Yes" and "No thanks" equal weight. No mascot, reward or streak tied to the choice.
2. **Parent hand-off.** Show "Please give the phone to your parent or guardian." Then show an adult-level, layered notice with the full contents below.
3. **Parent action.** The parent ticks an unticked "I am this learner's parent or guardian and I agree" box and taps Agree. Consider an adult-level task first, like Apple's parental gate. Simple sums are a weak gate for a maths app's users. This step is an inference with no NPC endorsement.
4. **Record without identity.** Store the time, notice version, language and "parent step completed." Store no parent name, email or ID.
5. **Research is not in this flow.** If a real study appears, add a separate, unticked parent opt-in. Limit it to de-identified data unless an ethics committee approves more.
6. **Current users.** Ask once, at a calm moment outside a lesson. Treat dismissal as "No," since non-response "does not constitute valid consent."
7. **Turning off.** Stop sending, clear the queue and delete sent data by default. Confirm the deletion on screen. Ask counsel whether any sent data may be kept.
8. **Access and export.** Offer "download my data" as JSON or CSV for that sharing ID.
9. **Re-consent.** Ask again when the purpose or data fields change. Ask counsel whether "time-bound" consent also needs a fixed renewal, such as yearly.

### Safeguards before launch

**Child Privacy Impact Assessment.** Controllers must "incorporate Child Privacy Impact Assessments (CPIA) as part of their PIAs before launching" ([Advisory 2024-03 §2(A)](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf)). Cover the age range, each data field and its purpose, storage and disposal, sharing with Cloudflare and GitHub, security, and the parent method. Record why the risk is low and why the benefits outweigh it. The NPC consulted on updated PIA guidelines in August 2026, so check for a final version ([Digital Policy Alert](https://digitalpolicyalert.org/event/42831-national-privacy-commission-opened-consultation-on-draft-updated-guidelines-on-conduct-of-privacy-impact-assessments)).

**Registration.** Decide with counsel. If mandatory, register online within 20 days of the system starting, notarised, for ₱500. Renew yearly for ₱350 and display the Seal. Include legal basis, retention, transfers abroad and the consent wording. Do not file the exemption declaration unless counsel confirms its "minors" wording can be sworn truthfully.

**Processor agreement.** Accept Cloudflare's DPA v6.4 and keep a dated copy. Check it against the nine IRR Sec. 44(b) terms. Record the `apac` hint as the processing location. ASEAN model clauses are optional extra comfort ([Advisory 2024-01](https://privacy.gov.ph/wp-content/uploads/2024/06/Published-NPC-Advisory-No.-2024-01-Contractual-Clauses-for-Cross-Border-Transfers_30May24.pdf)).

**Security and breach readiness.** Write a one-page security programme with an annual review, following the NPC's security circular ([Circular 2023-06](https://privacy.gov.ph/wp-content/uploads/2024/03/NPC-Circular-Repeal-16-01-Signed.pdf)). Keep a breach response plan, an incident log and the annual incident summary ([Circular 16-03](https://privacy.gov.ph/wp-content/uploads/2022/01/sgd-npc-circular-16-03-personal-data-breach-management.pdf)).

**Notice contents.** The parent and web notices should state:

- what is collected and what is never collected;
- the purpose (app improvement only) and the legal basis (parent's consent);
- the owner's name and the dedicated DPO email;
- recipients: Cloudflare, Inc. (backend) and GitHub (site hosting);
- location: "mainly Asia-Pacific; exact location not guaranteed";
- that IP addresses are seen in transit but not stored by Abante Minds;
- each retention period from the table above;
- how to turn sharing off, delete, and download data;
- that a lost sharing ID cannot be recovered, so its rows expire at 90 days;
- rights, with the right to complain to the NPC;
- risks and consequences, the importance of the setting, and the version date.

The child notice covers the same points in short, plain sentences. NEGRIHP's consent template targets the reading level of "a Filipino local student in Grade 6" ([2022 NEGRIHP](https://www.pchrd.dost.gov.ph/wp-content/uploads/2023/05/2022-NEGRIHP_Official-Gazatte_Ver-5-1.pdf)). That is a useful benchmark.

### Design changes in priority order

1. **Replace the child-ticked box** with the learner screen plus parent hand-off described above.
2. **Create a dedicated privacy and DPO email address** to replace the personal Gmail.
3. **Make "turn off" delete by default**, and build server-side delete and export by sharing ID.
4. **Implement retention**: a scheduled 90-day raw-event deletion, aggregation with small-group suppression, and backup windows.
5. **Remove "research later" from the current purpose.** Share only anonymised aggregates with researchers unless a study has its own consent and ethics approval.
6. **Configure Cloudflare** as set out under hosting. Use the `apac` hint, no read replication and no invocation logs. Store no IP or geodata, rate-limit on the sharing ID, and cap payloads.
7. **Keep per-learner adaptation on the phone.** Run only aggregate analysis on the server, to avoid "profiling" and its registration and notice duties.
8. **Publish the child, parent and web notices.** Ship the Filipino child notice at launch if possible.
9. **Limit analytics to Philippine traffic** with an in-memory country check that discards the IP.
10. **Add an in-app notices channel**, such as a static notice file, so breach alerts can reach users without contact details.
11. **Review each event field in the CPIA.** Drop any field, such as exact hour, that no named question needs.
12. **Keep DepEd and PSHS branding out**, and give teachers a one-page "optional, no data entry, no fees" guide.

## What a lawyer or school DPO must confirm

**Questions 1 to 4 decide the design; the rest refine it.** An NPC advisory opinion (question 17) is the cheapest official answer to the first four.

**Philippine privacy lawyer**

1. **Personal data.** Is a random, device-generated, never-displayed sharing ID with linked events "personal information" under DPA Sec. 3(g)? Does it matter that no name list exists, or that Cloudflare sees IPs in transit?
2. **Sensitive data.** Are right/wrong, mistake-pattern, hint, level and difficulty events tied to that ID "education" SPI under Sec. 3(l)(2)? Does the implicit Grade 6 age band count as "age"?
3. **Anonymisation route.** Would aggregation at ingestion, discarding per-ID events and suppressing small groups, meet the NPC's "anonymized in its truest sense" test?
4. **Who consents.** Must a parent consent as "lawful representative" (IRR Sec. 3(c); Circular 2023-04 §12)? Is the proposed hand-off step "appropriate ... based on the level of risk" under Advisory 2024-03?
5. **The child's yes.** Is the learner's own yes legally required, or only good practice?
6. **Time-bound consent.** Does IRR Sec. 19(a)(1) require periodic re-consent, and how often?
7. **After withdrawal.** May any sent data be kept after turn-off, and for how long (Circular 2023-04 §13(E))?
8. **Registration.** Is registration mandatory on the SPI, minors-risk or profiling grounds? How does an unpaid individual without DTI registration or a business permit register? Can the Annex 1 declaration be sworn truthfully?
9. **Profiling.** Does aggregate analysis of mistake patterns count as "profiling" under Circular 2022-04 §2(L), requiring §26 notification?
10. **Technical telemetry.** Can error codes, app version and offline flags rely on legitimate interest (Sec. 12(f)) separately from consent?
11. **Retention.** Are 90 days for raw events, 7 days for deletion and 30 days for backups acceptable as "necessary"?
12. **Rights without identity.** Is delete-by-sharing-ID sufficient? What is owed to a parent who lost the phone and the ID? Is in-app export needed for portability?
13. **Breach.** Would a leak of pseudonymous events be notifiable? Is an in-app plus public notice acceptable "alternative means" under Circular 16-03 §18 and Advisory 2026-02?
14. **Processor terms.** Does Cloudflare's DPA v6.4 cover Philippine-only data, given Self-Serve §6.1's European and CCPA framing? Does a non-guaranteed `apac` hint satisfy IRR Sec. 44's "geographic location"?
15. **Notice language.** Is an English-only notice acceptable at launch under Circular 2023-04 §3(E)?
16. **New rules.** Did the NPC adopt an advisory on children's personal data in September 2026, and what does it add? Has a digital age of consent been enacted?
17. **Advisory opinion.** Should the owner request an NPC advisory opinion on questions 1-4? The fee is ₱7,500 plus ₱75, and the answer is guidance only ([NPC](https://privacy.gov.ph/pips-and-pics/advisory-opinions/)).

**School DPO or DepEd office**

18. Would the school treat Abante Minds as an "official" or "unofficial" tool? Would it require a PIA or written data terms before teachers mention it?
19. Does teacher-authorised class use count as an "approved educational platform" under DO 006 s. 2026, and who approves it?
20. If a study ever recruits through schools, which office has jurisdiction and which documents apply? Does DO 16's data-set submission apply to external studies?

**Ethics committee or PSHS**

21. Is an in-app parent step plus child tap acceptable instead of witnessed assent? How must parental consent be validated under NEGRIHP's internet-research rules?
22. Can earlier product-analytics data be reused for a thesis, or is fresh consent required?
23. If PSHS students or NCE results are involved, who grants permission, and can any applicant data be shared?

**Foreign or commercial counsel (only if needed)**

24. Is a free, ad-free individual app "operated for commercial purposes" under COPPA? Would ads or Pro change that?
25. Would per-learner analytics of EU- or UK-located users be "monitoring" under GDPR Art. 3(2)(b)?
26. For Philippine app-store purchases, is the developer or the store the legal seller who must refund a minor's annulled purchase?
27. Do the ITA's e-retailer duties, such as publishing a physical address, apply to an individual selling through app stores?

## Sources

All sources were read on **21 October 2026** unless noted. Some privacy.gov.ph PDFs were downloaded directly because the site blocks automated fetches.

**Philippine law and NPC issuances**

- [Data Privacy Act, RA 10173 (Lawphil)](https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html)
- [IRR of the Data Privacy Act](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/)
- [NPC Advisories and Circulars list](https://privacy.gov.ph/pips-and-pics/advisories-circulars/)
- [NPC Advisory Opinions list](https://privacy.gov.ph/pips-and-pics/advisory-opinions/)
- [NPC Circular 2023-04, Guidelines on Consent (7 Nov 2023)](https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Circular-No.-2023-04_Guidelines-on-Consent_07Nov2023.pdf)
- [NPC Advisory 2024-03, Child-Oriented Transparency (17 Dec 2024)](https://privacy.gov.ph/wp-content/uploads/2024/12/Advisory-2024.12.17-Guidelines-on-Child-Oriented-Transparency-w-SGD.pdf)
- [NPC FAQ on Advisory 2024-03](https://privacy.gov.ph/wp-content/uploads/2024/12/FAQs-Advisory-on-Guidelines-on-Child-Oriented-Transparency.pdf)
- [NPC Circular 2022-04, Registration (5 Dec 2022)](https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04-2.pdf) and [Annex 1](https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04-Annex-1-1.pdf)
- [NPC Circular 2023-01, Schedule of Fees (17 May 2023)](https://privacy.gov.ph/wp-content/uploads/2023/05/Schedule-of-Fees-and-Charges-of-the-National-Privacy-Commission.pdf)
- [NPC Circular 2022-01, Administrative Fines (8 Aug 2022)](https://privacy.gov.ph/wp-content/uploads/2022/08/NPC-CIRCULAR-NO.-2022-01-GUIDELINES-ON-ADMINISTRATIVE-FINES-dated-08-AUGUST-2022-w-SGD.pdf)
- [NPC Circular 2023-06, Security (1 Dec 2023)](https://privacy.gov.ph/wp-content/uploads/2024/03/NPC-Circular-Repeal-16-01-Signed.pdf)
- [NPC Circular 16-03, Breach Management (15 Dec 2016)](https://privacy.gov.ph/wp-content/uploads/2022/01/sgd-npc-circular-16-03-personal-data-breach-management.pdf)
- [NPC Advisory 2026-02, Breach Notification (11 May 2026)](https://privacy.gov.ph/wp-content/uploads/2026/05/Advisory-Clarification-on-the-Submission-of-Personal-Data-Breach-Notification-through-DBNMS_11-May-2026.pdf)
- [NPC Advisory 2021-01, Data Subject Rights (29 Jan 2021)](https://privacy.gov.ph/wp-content/uploads/2026/05/SGD-Advisory-DS-Rights-29-Jan-2021.pdf)
- [NPC Advisory 2025-02, Privacy Engineering (27 Aug 2025)](https://privacy.gov.ph/wp-content/uploads/2025/12/NPC_Advisory2025-02.pdf)
- [NPC Advisory 2024-01, Model Contractual Clauses (30 May 2024)](https://privacy.gov.ph/wp-content/uploads/2024/06/Published-NPC-Advisory-No.-2024-01-Contractual-Clauses-for-Cross-Border-Transfers_30May24.pdf)
- [NPC Advisory 2023-01, Deceptive Design Patterns (7 Nov 2023)](https://privacy.gov.ph/wp-content/uploads/2023/11/NPC-Advisory-No.-2023-01-Guidelines-on-Deceptive-Design-Patterns_7Nov23.pdf) (not read in full)
- [NPC Advisory 2017-01, DPO (14 Mar 2017)](https://privacy.gov.ph/wp-content/uploads/2022/01/NPC-Advisory-2017-01-sgd.pdf)
- NPC Advisory Opinions [2017-012](https://privacy.gov.ph/wp-content/uploads/2022/01/NPC_AdvisoryOpinionNo._2017-012.pdf), [2017-019](https://privacy.gov.ph/wp-content/uploads/2022/01/NPC_AdvisoryOpinionNo._2017-019.pdf), [2017-027](https://privacy.gov.ph/wp-content/uploads/2022/01/NPC_AdvisoryOpinionNo._2017-027.pdf), [2018-029](https://privacy.gov.ph/wp-content/uploads/2022/01/AdOpNo.2018-029.pdf), [2020-029](https://privacy.gov.ph/wp-content/uploads/2022/01/Redacted-Advisory-Opinion-No.-2020-029.pdf), [2020-046](https://privacy.gov.ph/wp-content/uploads/2022/01/Redacted-Advisory-Opinion-No.-2020-046.pdf), [2021-001](https://privacy.gov.ph/wp-content/uploads/2022/01/Redacted-Advisory-Opinion-No.-2021-001.pdf), [2025-017](https://privacy.gov.ph/wp-content/uploads/2026/01/NPC-Advisory-Opinion-No.-2025-017_Redactedv2.pdf)
- [DPC Education Sector Advisory 2020-1](https://privacy.gov.ph/wp-content/uploads/2023/05/DP-Council-Education-Sector-Advisory-No.-2020-1.pdf)
- [Civil Code, RA 386 (Lawphil)](https://lawphil.net/statutes/repacts/ra1949/ra_386_1949.html) and [RA 6809 (Lawphil)](https://www.lawphil.net/statutes/repacts/ra1989/ra_6809_1989.html)
- [Consumer Act, RA 7394 (Lawphil)](https://lawphil.net/statutes/repacts/ra1992/ra_7394_1992.html) and [Internet Transactions Act, RA 11967 (Lawphil)](https://lawphil.net/statutes/repacts/ra2023/ra_11967_2023.html)
- [ASC Code of Ethics: Protection of Children](https://asc.com.ph/our-standards/code-of-ethics/protection-of-children/)

**DepEd, PSHS and research ethics**

- [DepEd DO 16 s. 2017, Research Management Guidelines](https://www.deped.gov.ph/wp-content/uploads/2017/03/DO_s2017_016.pdf)
- [DepEd PPRD legal bases](https://sites.google.com/deped.gov.ph/pprd/legal-bases)
- [DepEd Region III, Request to Conduct Study](https://region3.deped.gov.ph/services/request-to-conduct-study/)
- [DepEd Region VIII OM 494 s. 2022](https://region8.deped.gov.ph/wp-content/uploads/2022/09/OM-s2022-494.pdf)
- DepEd [DO 18 s. 2004](https://deped.gov.ph/?p=7145), [DO 39 s. 2009](https://www.deped.gov.ph/?p=5257), [DO 37 s. 2010](https://deped.gov.ph/?p=7508), [DO 85 s. 1992](https://www.deped.gov.ph/?p=4239)
- [DepEd no-collection reminder (6 Aug 2024)](https://www.deped.gov.ph/2024/08/06/deped-reminds-schools-to-adhere-to-no-collection-policy/)
- [PSHS System Data Privacy Notice](https://pshs.edu.ph/privacy-policy/)
- [2022 NEGRIHP (PHREB, via DOST-PCHRD)](https://www.pchrd.dost.gov.ph/wp-content/uploads/2023/05/2022-NEGRIHP_Official-Gazatte_Ver-5-1.pdf)
- [UPLB REB Research Ethics FAQ](https://reb.uplb.edu.ph/wp-content/uploads/2024/04/2024-04-Research-Ethics-FAQs-and-2022-NEGRIHP.docx.pdf) and [UP CHE REC FAQs](https://sites.google.com/up.edu.ph/upcherec/faqs)

**Hosting vendors**

- Cloudflare: [D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/), [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [Self-Serve Agreement](https://www.cloudflare.com/terms/), [Customer DPA v6.4](https://www.cloudflare.com/cloudflare-customer-dpa/), [Privacy Policy](https://www.cloudflare.com/privacypolicy/)
- GitHub: [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [About Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages), [Additional product terms](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features), [Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies), [Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
- Google: [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas), [Apps Script terms](https://developers.google.com/apps-script/terms), [Workspace data regions](https://knowledge.workspace.google.com/admin/compliance/choose-a-geographic-location-for-your-data?hl=en)
- Supabase: [Pricing](https://supabase.com/pricing), [Regions](https://supabase.com/docs/guides/platform/regions), [Terms](https://supabase.com/terms), [DPA](https://supabase.com/legal/dpa)
- [Alibaba Cloud endpoint reference (Manila region)](https://www.alibabacloud.com/help/en/asc/developer-reference/api-aisc-2026-01-01-endpoint)

**App stores**

- Google Play: [Families Policy](https://support.google.com/googleplay/android-developer/answer/9893335), [Self-Certified Ads SDK list](https://support.google.com/googleplay/android-developer/answer/9859768), [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en), [Teacher Approved](https://support.google.com/googleplay/android-developer/answer/10075896?hl=en), [Play Age Signals API](https://support.google.com/googleplay/android-developer/answer/16569691?hl=en), [Play policy timeline](https://developer.android.com/distribute/play-policies)
- Apple: [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Kids](https://developer.apple.com/kids/), [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/), [Ask to Buy](https://support.apple.com/en-us/105055), [Tracking permission](https://support.apple.com/en-us/102420), [Age assurance](https://developer.apple.com/support/age-assurance), [Developer News, 3 Jun 2026](https://developer.apple.com/news/?id=sg176nne)

**COPPA, GDPR and UK**

- [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [COPPA final rule, 90 FR, 22 Apr 2025 (GovInfo)](https://www.govinfo.gov/content/pkg/FR-2025-04-22/html/2025-05904.htm); canonical text at [eCFR Part 312](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312) (blocked to automated reading)
- FTC actions: [Apitor (Sept 2025)](https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-takes-action-against-robot-toy-maker-allowing-collection-childrens-data-without-parental-consent), [HoYoverse (Jan 2025)](https://www.ftc.gov/news-events/news/press-releases/2025/01/genshin-impact-game-developer-will-be-banned-selling-lootboxes-teens-under-16-without-parental)
- [EDPB Guidelines 3/2018 on territorial scope](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_3_2018_territorial_scope_after_public_consultation_en_1.pdf)
- [GDPR (EUR-Lex)](https://eur-lex.europa.eu/eli/reg/2016/679/oj); wording read from [gdpr-info.eu Art. 8](https://gdpr-info.eu/art-8-gdpr/) and [Recital 26](https://gdpr-info.eu/recitals/no-26/) (unofficial mirror)
- [CURIA, EDPS v SRB, C-413/23 P (4 Sept 2025)](https://curia.europa.eu/jcms/jcms/p1_5127926/sv)
- [ICO, services covered by the Children's Code](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/services-covered-by-this-code/)

**Duolingo**

- [Help: Super](https://www.duolingo.com/help/super-duolingo), [Super page](https://www.duolingo.com/super), [Family Plan](https://www.duolingo.com/help/family-plan), [Max](https://www.duolingo.com/help/what-is-duolingo-max), [Help Center](https://www.duolingo.com/help)
- [Privacy Policy (revised 26 May 2026)](https://www.duolingo.com/privacy)
- [Blog: Energy (3 Jul 2025)](https://blog.duolingo.com/duolingo-energy/)
- SEC filings: [Q4 FY2025 shareholder letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm), [Q2 2026 shareholder letter](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm)
- [App Store Philippines listing](https://apps.apple.com/ph/app/duolingo-language-lessons/id570060128)

**Secondary sources (lower confidence; verify before relying)**

- [Context.ph, 22 Sept 2026](https://context.ph/2026/09/22/npc-tightens-scrutiny-of-digital-platforms-over-childrens-data/) and [Digital Policy Alert](https://digitalpolicyalert.org/event/43940-national-privacy-commission-adopted-advisory-on-processing-of-childrens-personal-data) on a reported NPC children's advisory
- [Digital Policy Alert on draft PIA guidelines](https://digitalpolicyalert.org/event/42831-national-privacy-commission-opened-consultation-on-draft-updated-guidelines-on-conduct-of-privacy-impact-assessments) and [on HB 898](https://digitalpolicyalert.org/event/23343-introduced-amendments-to-the-data-privacy-act-of-2012-hb-no-898-including-data-protection-regulation)
- [DepEdClub explainer on DO 006 s. 2026](https://depedclub.com/deped-order-006-2026-esmle-cellphone-rules-school-safety/) (official text not read)
- [TeacherPH copy of DO 28 s. 2001](https://www.teacherph.com/prohibition-commercialization-decs-organization-endorsements-accreditation-goods-services/)
- [Wiley Rein alert on state app store laws, 8 Jun 2026](https://www.wiley.law/alert-Key-Developments-With-State-App-Store-Accountability-Acts-as-Texas-Act-Takes-Effect)
- [Newsbytes.PH on proposed AWS investment, 8 Jul 2026](https://newsbytes.ph/2026/07/08/marcos-jr-meets-aws-execs-over-proposed-5-b-cloud-investment-in-ph/)
- [Webull transcript of Duolingo's Q2 2026 call](https://www.webull.com/news/15392596720296960)
- [Castro and Valença, IHC 2025](https://sol.sbc.org.br/index.php/ihc/article/view/37677)
