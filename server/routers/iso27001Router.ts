// @ts-nocheck
import { z } from "zod";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { iso27001Controls, complianceEvidenceFiles } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { storagePut } from "../storage";

const ISO27001_SEED = [
  // Clause 5 - Organisational Controls
  { controlId: "5.1", clause: "5 - Organisational Controls", name: "Policies for information security", description: "Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel.", status: "compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "5.2", clause: "5 - Organisational Controls", name: "Information security roles and responsibilities", description: "Information security roles and responsibilities shall be defined and allocated according to the organisation needs.", status: "compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "5.3", clause: "5 - Organisational Controls", name: "Segregation of duties", description: "Conflicting duties and conflicting areas of responsibility shall be segregated.", status: "partial" as const, ownerName: "COO", testingFrequency: "Annual" },
  { controlId: "5.4", clause: "5 - Organisational Controls", name: "Management responsibilities", description: "Management shall require all personnel to apply information security in accordance with the established information security policy.", status: "compliant" as const, ownerName: "CEO", testingFrequency: "Annual" },
  { controlId: "5.5", clause: "5 - Organisational Controls", name: "Contact with authorities", description: "The organisation shall establish and maintain contact with relevant authorities.", status: "partial" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "5.6", clause: "5 - Organisational Controls", name: "Contact with special interest groups", description: "The organisation shall establish and maintain contact with special interest groups or other specialist security forums and professional associations.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "5.7", clause: "5 - Organisational Controls", name: "Threat intelligence", description: "Information relating to information security threats shall be collected and analysed to produce threat intelligence.", status: "non_compliant" as const, ownerName: "CISO", testingFrequency: "Monthly" },
  { controlId: "5.8", clause: "5 - Organisational Controls", name: "Information security in project management", description: "Information security shall be integrated into project management.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "5.9", clause: "5 - Organisational Controls", name: "Inventory of information and other associated assets", description: "An inventory of information and other associated assets, including owners, shall be developed and maintained.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "5.10", clause: "5 - Organisational Controls", name: "Acceptable use of information and other associated assets", description: "Rules for the acceptable use and procedures for handling information and other associated assets shall be identified, documented and implemented.", status: "compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "5.11", clause: "5 - Organisational Controls", name: "Return of assets", description: "Personnel and other interested parties shall return all the organisation assets in their possession upon change or termination of their employment.", status: "compliant" as const, ownerName: "HR Director", testingFrequency: "Per-event" },
  { controlId: "5.12", clause: "5 - Organisational Controls", name: "Classification of information", description: "Information shall be classified according to the information security needs of the organisation based on confidentiality, integrity, availability and relevant interested party requirements.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "5.13", clause: "5 - Organisational Controls", name: "Labelling of information", description: "An appropriate set of procedures for information labelling shall be developed and implemented in accordance with the information classification scheme adopted by the organisation.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "5.14", clause: "5 - Organisational Controls", name: "Information transfer", description: "Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organisation and between the organisation and other parties.", status: "partial" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "5.15", clause: "5 - Organisational Controls", name: "Access control", description: "Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "5.16", clause: "5 - Organisational Controls", name: "Identity management", description: "The full life cycle of identities shall be managed.", status: "compliant" as const, ownerName: "IT Manager", testingFrequency: "Monthly" },
  { controlId: "5.17", clause: "5 - Organisational Controls", name: "Authentication information", description: "Allocation and management of authentication information shall be controlled by a management process.", status: "compliant" as const, ownerName: "IT Manager", testingFrequency: "Quarterly" },
  { controlId: "5.18", clause: "5 - Organisational Controls", name: "Access rights", description: "Access rights to information and other associated assets shall be provisioned, reviewed, modified and removed in accordance with the organisation topic-specific policy on access control.", status: "partial" as const, ownerName: "IT Manager", testingFrequency: "Monthly" },
  { controlId: "5.19", clause: "5 - Organisational Controls", name: "Information security in supplier relationships", description: "Processes and procedures shall be defined and implemented to manage the information security risks associated with the use of supplier products or services.", status: "non_compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "5.20", clause: "5 - Organisational Controls", name: "Addressing information security within supplier agreements", description: "Relevant information security requirements shall be established and agreed with each supplier based on the type of supplier relationship.", status: "non_compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "5.21", clause: "5 - Organisational Controls", name: "Managing information security in the ICT supply chain", description: "Processes and procedures shall be defined and implemented to manage the information security risks associated with the ICT products and services supply chain.", status: "non_compliant" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "5.22", clause: "5 - Organisational Controls", name: "Monitoring, review and change management of supplier services", description: "The organisation shall regularly monitor, review, evaluate and manage change in supplier information security practices and service delivery.", status: "non_compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "5.23", clause: "5 - Organisational Controls", name: "Information security for use of cloud services", description: "Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organisation information security requirements.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "5.24", clause: "5 - Organisational Controls", name: "Information security incident management planning and preparation", description: "The organisation shall plan and prepare for managing information security incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "5.25", clause: "5 - Organisational Controls", name: "Assessment and decision on information security events", description: "The organisation shall assess information security events and decide if they are to be categorised as information security incidents.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Per-event" },
  { controlId: "5.26", clause: "5 - Organisational Controls", name: "Response to information security incidents", description: "Information security incidents shall be responded to in accordance with the documented procedures.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Per-event" },
  { controlId: "5.27", clause: "5 - Organisational Controls", name: "Learning from information security incidents", description: "Knowledge gained from information security incidents shall be used to strengthen and improve the information security controls.", status: "non_compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "5.28", clause: "5 - Organisational Controls", name: "Collection of evidence", description: "The organisation shall establish and implement procedures for the identification, collection, acquisition and preservation of evidence related to information security events.", status: "non_compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "5.29", clause: "5 - Organisational Controls", name: "Information security during disruption", description: "The organisation shall plan how to maintain information security at an appropriate level during disruption.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "5.30", clause: "5 - Organisational Controls", name: "ICT readiness for business continuity", description: "ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "5.31", clause: "5 - Organisational Controls", name: "Legal, statutory, regulatory and contractual requirements", description: "Legal, statutory, regulatory and contractual requirements relevant to information security shall be identified, documented and kept up to date.", status: "compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "5.32", clause: "5 - Organisational Controls", name: "Intellectual property rights", description: "The organisation shall implement appropriate procedures to protect intellectual property rights.", status: "compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "5.33", clause: "5 - Organisational Controls", name: "Protection of records", description: "Records shall be protected from loss, destruction, falsification, unauthorised access and unauthorised release.", status: "compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "5.34", clause: "5 - Organisational Controls", name: "Privacy and protection of PII", description: "The organisation shall identify and meet the requirements regarding the preservation of privacy and protection of PII according to applicable laws and regulations and contractual requirements.", status: "partial" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "5.35", clause: "5 - Organisational Controls", name: "Independent review of information security", description: "The organisation approach to managing information security and its implementation shall be reviewed independently at planned intervals.", status: "non_compliant" as const, ownerName: "Internal Audit", testingFrequency: "Annual" },
  { controlId: "5.36", clause: "5 - Organisational Controls", name: "Compliance with policies, rules and standards for information security", description: "Compliance with the organisation information security policy, topic-specific policies, rules and standards shall be regularly reviewed.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "5.37", clause: "5 - Organisational Controls", name: "Documented operating procedures", description: "Operating procedures for information processing facilities shall be documented and made available to personnel who need them.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Annual" },
  // Clause 6 - People Controls
  { controlId: "6.1", clause: "6 - People Controls", name: "Screening", description: "Background verification checks on all candidates to become personnel shall be carried out prior to joining the organisation.", status: "compliant" as const, ownerName: "HR Director", testingFrequency: "Per-hire" },
  { controlId: "6.2", clause: "6 - People Controls", name: "Terms and conditions of employment", description: "The employment contractual agreements shall state the personnel and the organisation responsibilities for information security.", status: "compliant" as const, ownerName: "HR Director", testingFrequency: "Annual" },
  { controlId: "6.3", clause: "6 - People Controls", name: "Information security awareness, education and training", description: "Personnel of the organisation and relevant interested parties shall receive appropriate information security awareness, education and training.", status: "partial" as const, ownerName: "HR Director", testingFrequency: "Annual" },
  { controlId: "6.4", clause: "6 - People Controls", name: "Disciplinary process", description: "A disciplinary process shall be formalised and communicated to take actions against personnel who have committed an information security policy violation.", status: "compliant" as const, ownerName: "HR Director", testingFrequency: "Annual" },
  { controlId: "6.5", clause: "6 - People Controls", name: "Responsibilities after termination or change of employment", description: "Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated.", status: "compliant" as const, ownerName: "HR Director", testingFrequency: "Per-event" },
  { controlId: "6.6", clause: "6 - People Controls", name: "Confidentiality or non-disclosure agreements", description: "Confidentiality or non-disclosure agreements reflecting the organisation needs for the protection of information shall be identified, documented, regularly reviewed and signed.", status: "compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "6.7", clause: "6 - People Controls", name: "Remote working", description: "Security measures shall be implemented when personnel are working remotely to protect information accessed, processed or stored outside the organisation premises.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "6.8", clause: "6 - People Controls", name: "Information security event reporting", description: "The organisation shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  // Clause 7 - Physical Controls
  { controlId: "7.1", clause: "7 - Physical Controls", name: "Physical security perimeters", description: "Security perimeters shall be defined and used to protect areas that contain information and other associated assets.", status: "compliant" as const, ownerName: "Facilities", testingFrequency: "Annual" },
  { controlId: "7.2", clause: "7 - Physical Controls", name: "Physical entry", description: "Secure areas shall be protected by appropriate entry controls and access points.", status: "compliant" as const, ownerName: "Facilities", testingFrequency: "Annual" },
  { controlId: "7.3", clause: "7 - Physical Controls", name: "Securing offices, rooms and facilities", description: "Physical security for offices, rooms and facilities shall be designed and implemented.", status: "compliant" as const, ownerName: "Facilities", testingFrequency: "Annual" },
  { controlId: "7.4", clause: "7 - Physical Controls", name: "Physical security monitoring", description: "Premises shall be continuously monitored for unauthorised physical access.", status: "partial" as const, ownerName: "Facilities", testingFrequency: "Annual" },
  { controlId: "7.5", clause: "7 - Physical Controls", name: "Protecting against physical and environmental threats", description: "Protection against physical and environmental threats shall be designed and implemented.", status: "partial" as const, ownerName: "Facilities", testingFrequency: "Annual" },
  { controlId: "7.6", clause: "7 - Physical Controls", name: "Working in secure areas", description: "Security measures for working in secure areas shall be designed and implemented.", status: "compliant" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "7.7", clause: "7 - Physical Controls", name: "Clear desk and clear screen", description: "Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities shall be defined and appropriately enforced.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "7.8", clause: "7 - Physical Controls", name: "Equipment siting and protection", description: "Equipment shall be sited securely and protected.", status: "compliant" as const, ownerName: "IT Manager", testingFrequency: "Annual" },
  { controlId: "7.9", clause: "7 - Physical Controls", name: "Security of assets off-premises", description: "Off-site assets shall be protected.", status: "partial" as const, ownerName: "IT Manager", testingFrequency: "Annual" },
  { controlId: "7.10", clause: "7 - Physical Controls", name: "Storage media", description: "Storage media shall be managed through its life cycle of acquisition, use, transportation and disposal in accordance with the organisation classification scheme.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "7.11", clause: "7 - Physical Controls", name: "Supporting utilities", description: "Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities.", status: "compliant" as const, ownerName: "Facilities", testingFrequency: "Annual" },
  { controlId: "7.12", clause: "7 - Physical Controls", name: "Cabling security", description: "Cables carrying power, data or supporting information services shall be protected from interception, interference or damage.", status: "compliant" as const, ownerName: "IT Manager", testingFrequency: "Annual" },
  { controlId: "7.13", clause: "7 - Physical Controls", name: "Equipment maintenance", description: "Equipment shall be maintained correctly to ensure availability, integrity and confidentiality of information.", status: "compliant" as const, ownerName: "IT Manager", testingFrequency: "Annual" },
  { controlId: "7.14", clause: "7 - Physical Controls", name: "Secure disposal or re-use of equipment", description: "Items of equipment containing storage media shall be verified to ensure that any sensitive data has been removed or securely overwritten prior to disposal or re-use.", status: "partial" as const, ownerName: "IT Manager", testingFrequency: "Per-event" },
  // Clause 8 - Technological Controls
  { controlId: "8.1", clause: "8 - Technological Controls", name: "User endpoint devices", description: "Information stored on, processed by or accessible via user endpoint devices shall be protected.", status: "compliant" as const, ownerName: "IT Manager", testingFrequency: "Quarterly" },
  { controlId: "8.2", clause: "8 - Technological Controls", name: "Privileged access rights", description: "The allocation and use of privileged access rights shall be restricted and managed.", status: "compliant" as const, ownerName: "IT Manager", testingFrequency: "Monthly" },
  { controlId: "8.3", clause: "8 - Technological Controls", name: "Information access restriction", description: "Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "8.4", clause: "8 - Technological Controls", name: "Access to source code", description: "Read and write access to source code, development tools and software libraries shall be appropriately managed.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "8.5", clause: "8 - Technological Controls", name: "Secure authentication", description: "Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "8.6", clause: "8 - Technological Controls", name: "Capacity management", description: "The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Monthly" },
  { controlId: "8.7", clause: "8 - Technological Controls", name: "Protection against malware", description: "Protection against malware shall be implemented and supported by appropriate user awareness.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Monthly" },
  { controlId: "8.8", clause: "8 - Technological Controls", name: "Management of technical vulnerabilities", description: "Information about technical vulnerabilities of information systems in use shall be obtained, the organisation exposure evaluated and appropriate measures taken.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Monthly" },
  { controlId: "8.9", clause: "8 - Technological Controls", name: "Configuration management", description: "Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "8.10", clause: "8 - Technological Controls", name: "Information deletion", description: "Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.", status: "partial" as const, ownerName: "CISO", testingFrequency: "Annual" },
  { controlId: "8.11", clause: "8 - Technological Controls", name: "Data masking", description: "Data masking shall be used in accordance with the organisation topic-specific policy on access control and other related topic-specific policies, and business requirements.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "8.12", clause: "8 - Technological Controls", name: "Data leakage prevention", description: "Data leakage prevention measures shall be applied to systems, networks and any other devices that process, store or transmit sensitive information.", status: "non_compliant" as const, ownerName: "CISO", testingFrequency: "Quarterly" },
  { controlId: "8.13", clause: "8 - Technological Controls", name: "Information backup", description: "Backup copies of information, software and systems shall be maintained and regularly tested in accordance with the agreed topic-specific policy on backup.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Monthly" },
  { controlId: "8.14", clause: "8 - Technological Controls", name: "Redundancy of information processing facilities", description: "Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "8.15", clause: "8 - Technological Controls", name: "Logging", description: "Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Continuous" },
  { controlId: "8.16", clause: "8 - Technological Controls", name: "Monitoring activities", description: "Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Continuous" },
  { controlId: "8.17", clause: "8 - Technological Controls", name: "Clock synchronisation", description: "The clocks of information processing systems used by the organisation shall be synchronised to approved time sources.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "8.18", clause: "8 - Technological Controls", name: "Use of privileged utility programs", description: "The use of utility programs that can be capable of overriding system and application controls shall be restricted and tightly controlled.", status: "compliant" as const, ownerName: "IT Manager", testingFrequency: "Quarterly" },
  { controlId: "8.19", clause: "8 - Technological Controls", name: "Installation of software on operational systems", description: "Procedures and measures shall be implemented to securely manage software installation on operational systems.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Continuous" },
  { controlId: "8.20", clause: "8 - Technological Controls", name: "Networks security", description: "Networks and network devices shall be secured, managed and controlled to protect information in systems and applications.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "8.21", clause: "8 - Technological Controls", name: "Security of network services", description: "Security mechanisms, service levels and service requirements of network services shall be identified, implemented and monitored.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Quarterly" },
  { controlId: "8.22", clause: "8 - Technological Controls", name: "Segregation of networks", description: "Groups of information services, users and information systems shall be segregated in the organisation networks.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "8.23", clause: "8 - Technological Controls", name: "Web filtering", description: "Access to external websites shall be managed to reduce exposure to malicious content.", status: "partial" as const, ownerName: "IT Manager", testingFrequency: "Annual" },
  { controlId: "8.24", clause: "8 - Technological Controls", name: "Use of cryptography", description: "Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "8.25", clause: "8 - Technological Controls", name: "Secure development life cycle", description: "Rules for the secure development of software and systems shall be established and applied.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Continuous" },
  { controlId: "8.26", clause: "8 - Technological Controls", name: "Application security requirements", description: "Information security requirements shall be identified, specified and approved when developing or acquiring applications.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Per-project" },
  { controlId: "8.27", clause: "8 - Technological Controls", name: "Secure system architecture and engineering principles", description: "Principles for engineering secure systems shall be established, documented, maintained and applied to any information system development or integration activities.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "8.28", clause: "8 - Technological Controls", name: "Secure coding", description: "Secure coding principles shall be applied to software development.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Continuous" },
  { controlId: "8.29", clause: "8 - Technological Controls", name: "Security testing in development and acceptance", description: "Security testing processes shall be defined and implemented in the development life cycle.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Per-release" },
  { controlId: "8.30", clause: "8 - Technological Controls", name: "Outsourced development", description: "The organisation shall direct, monitor and review the activities related to outsourced system development.", status: "non_compliant" as const, ownerName: "Legal", testingFrequency: "Annual" },
  { controlId: "8.31", clause: "8 - Technological Controls", name: "Separation of development, test and production environments", description: "Development, testing and production environments shall be separated and secured.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Annual" },
  { controlId: "8.32", clause: "8 - Technological Controls", name: "Change management", description: "Changes to information processing facilities and information systems shall be subject to change management procedures.", status: "compliant" as const, ownerName: "CTO", testingFrequency: "Continuous" },
  { controlId: "8.33", clause: "8 - Technological Controls", name: "Test information", description: "Test information shall be appropriately selected, protected and managed.", status: "partial" as const, ownerName: "CTO", testingFrequency: "Per-release" },
  { controlId: "8.34", clause: "8 - Technological Controls", name: "Protection of information systems during audit testing", description: "Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management.", status: "partial" as const, ownerName: "Internal Audit", testingFrequency: "Annual" },
];

export const iso27001Router = router({
  seedIfEmpty: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const existing = await db.select({ id: iso27001Controls.id }).from(iso27001Controls).limit(1);
    if (existing.length > 0) return { seeded: false, count: 0 };
    await db.insert(iso27001Controls).values(ISO27001_SEED);
    return { seeded: true, count: ISO27001_SEED.length };
  }),

  getControls: protectedProcedure
    .input(z.object({ clause: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(iso27001Controls);
      if (input?.clause) return rows.filter(r => r.clause === input.clause);
      return rows;
    }),

  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, compliant: 0, partial: 0, nonCompliant: 0, notApplicable: 0, score: 0 };
    const rows = await db.select().from(iso27001Controls);
    const total = rows.length;
    const compliant = rows.filter(r => r.status === "compliant").length;
    const partial = rows.filter(r => r.status === "partial").length;
    const nonCompliant = rows.filter(r => r.status === "non_compliant").length;
    const notApplicable = rows.filter(r => r.status === "not_applicable").length;
    const applicable = total - notApplicable;
    const score = applicable > 0 ? Math.round(((compliant + partial * 0.5) / applicable) * 100) : 0;
    return { total, compliant, partial, nonCompliant, notApplicable, score };
  }),

  getClauses: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(iso27001Controls);
    const map = new Map<string, { clause: string; total: number; compliant: number; partial: number; nonCompliant: number }>();
    for (const r of rows) {
      if (!map.has(r.clause)) map.set(r.clause, { clause: r.clause, total: 0, compliant: 0, partial: 0, nonCompliant: 0 });
      const entry = map.get(r.clause)!;
      entry.total++;
      if (r.status === "compliant") entry.compliant++;
      else if (r.status === "partial") entry.partial++;
      else if (r.status === "non_compliant") entry.nonCompliant++;
    }
    return Array.from(map.values());
  }),

  updateControl: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["compliant", "partial", "non_compliant", "not_applicable"]).optional(),
      ownerName: z.string().optional(),
      notes: z.string().optional(),
      testingFrequency: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      if (Object.keys(filtered).length === 0) return { updated: false };
      await db.update(iso27001Controls).set(filtered).where(eq(iso27001Controls.id, id));
      return { updated: true };
    }),

  assignOwner: protectedProcedure
    .input(z.object({
      id: z.number(),
      ownerName: z.string().min(1).max(100),
      testingFrequency: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(iso27001Controls)
        .set({ ownerName: input.ownerName, testingFrequency: input.testingFrequency ?? null })
        .where(eq(iso27001Controls.id, input.id));
      return { assigned: true, ownerName: input.ownerName };
    }),

  uploadEvidence: protectedProcedure
    .input(z.object({
      controlId: z.number(),
      fileName: z.string().min(1).max(255),
      fileBase64: z.string(),
      mimeType: z.string().default("application/octet-stream"),
      expiresAt: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const buf = Buffer.from(input.fileBase64, "base64");
      if (buf.byteLength > 16 * 1024 * 1024) throw new Error("File too large (max 16 MB)");
      const suffix = Date.now().toString(36);
      const fileKey = `compliance/iso27001/${input.controlId}/${suffix}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buf, input.mimeType);
      await db.insert(complianceEvidenceFiles).values({
        controlType: "iso27001",
        controlId: input.controlId,
        fileName: input.fileName,
        fileUrl: url,
        fileKey,
        mimeType: input.mimeType,
        uploadedBy: ctx.user.id,
        uploadedAt: Date.now(),
        expiresAt: input.expiresAt ?? null,
      });
      return { uploaded: true, url, fileName: input.fileName };
    }),

  bulkImportCSV: protectedProcedure
    .input(z.object({ csvBase64: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const csv = Buffer.from(input.csvBase64, "base64").toString("utf-8");
      const lines = csv.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
      const controlIdIdx = headers.indexOf("control_id");
      const statusIdx = headers.indexOf("status");
      const ownerIdx = headers.indexOf("owner_name");
      const notesIdx = headers.indexOf("notes");
      if (controlIdIdx === -1 || statusIdx === -1) throw new Error("CSV must have 'control_id' and 'status' columns");
      const VALID_STATUSES = ["compliant", "partial", "non_compliant", "not_applicable"];
      let updated = 0; let skipped = 0; const errors: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        const controlIdVal = cols[controlIdIdx];
        const statusVal = cols[statusIdx]?.toLowerCase().replace(/ /g, "_");
        if (!controlIdVal || !statusVal) { skipped++; continue; }
        if (!VALID_STATUSES.includes(statusVal)) { errors.push(`Row ${i + 1}: invalid status '${statusVal}'`); skipped++; continue; }
        const existing = await db.select({ id: iso27001Controls.id }).from(iso27001Controls).where(eq(iso27001Controls.controlId, controlIdVal)).limit(1);
        if (existing.length === 0) { errors.push(`Row ${i + 1}: control_id '${controlIdVal}' not found`); skipped++; continue; }
        const updateData: Record<string, string> = { status: statusVal };
        if (ownerIdx !== -1 && cols[ownerIdx]) updateData.ownerName = cols[ownerIdx];
        if (notesIdx !== -1 && cols[notesIdx]) updateData.notes = cols[notesIdx];
        await db.update(iso27001Controls).set(updateData).where(eq(iso27001Controls.id, existing[0].id));
        updated++;
      }
      return { updated, skipped, errors, total: lines.length - 1 };
    }),

  exportAuditZip: protectedProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const archiver = _require("archiver");
      const controls = await db.select().from(iso27001Controls);
      const evidence = await db.select().from(complianceEvidenceFiles).where(eq(complianceEvidenceFiles.controlType, "iso27001"));
      const csvHeader = "control_id,clause,name,status,owner_name,testing_frequency,notes\n";
      const csvRows = controls.map(c =>
        [c.controlId, c.clause, `"${c.name}"`, c.status, c.ownerName ?? "", c.testingFrequency ?? "", `"${(c.notes ?? "").replace(/"/g, "'")}"` ].join(",")
      ).join("\n");
      const manifestLines = ["id,control_id,file_name,file_url,uploaded_at,expires_at"];
      for (const e of evidence) {
        manifestLines.push([e.id, e.controlId, e.fileName, e.fileUrl, new Date(e.uploadedAt).toISOString(), e.expiresAt ? new Date(e.expiresAt).toISOString() : ""].join(","));
      }
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        const archive = archiver("zip", { zlib: { level: 6 } });
        archive.on("data", (chunk: Buffer) => chunks.push(chunk));
        archive.on("end", resolve);
        archive.on("error", reject);
        archive.append(csvHeader + csvRows, { name: "iso27001_controls.csv" });
        archive.append(manifestLines.join("\n"), { name: "evidence_manifest.csv" });
        archive.append(JSON.stringify({ framework: "ISO 27001", exportedAt: new Date().toISOString(), controlCount: controls.length, evidenceCount: evidence.length }, null, 2), { name: "audit_summary.json" });
        archive.finalize();
      });
      const zipBuffer = Buffer.concat(chunks);
      const suffix = Date.now().toString(36);
      const fileKey = `compliance/exports/iso27001-audit-pack-${suffix}.zip`;
      const { url } = await storagePut(fileKey, zipBuffer, "application/zip");
      return { url, fileName: `iso27001-audit-pack-${new Date().toISOString().slice(0, 10)}.zip`, controlCount: controls.length, evidenceCount: evidence.length };
    }),

  getEvidenceFiles: protectedProcedure
    .input(z.object({ controlId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(complianceEvidenceFiles)
        .where(and(
          eq(complianceEvidenceFiles.controlType, "iso27001"),
          eq(complianceEvidenceFiles.controlId, input.controlId)
        ))
        .orderBy(complianceEvidenceFiles.uploadedAt);
    }),

  deleteEvidence: protectedProcedure
    .input(z.object({ evidenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(complianceEvidenceFiles).where(eq(complianceEvidenceFiles.id, input.evidenceId));
      return { deleted: true };
    }),
});
