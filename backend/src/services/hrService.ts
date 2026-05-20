import prisma from '../lib/prisma';
import { logger } from '../utils/logger';
import { complete, AI_MODELS } from './aiClient';

export class HRService {
  /**
   * Create a job vacancy
   */
  async createVacancy(data: {
    title: string;
    department: string;
    location?: string;
    locationType?: string;
    employmentType?: string;
    description: string;
    requirements?: string[];
    responsibilities?: string[];
    benefits?: string[];
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    closingDate?: Date;
    createdBy?: string;
  }) {
    const vacancy = await prisma.jobVacancy.create({
      data: {
        title: data.title,
        department: data.department,
        location: data.location,
        locationType: data.locationType || 'REMOTE',
        employmentType: data.employmentType || 'FULL_TIME',
        description: data.description,
        requirements: data.requirements ? JSON.stringify(data.requirements) : null,
        responsibilities: data.responsibilities ? JSON.stringify(data.responsibilities) : null,
        benefits: data.benefits ? JSON.stringify(data.benefits) : null,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency || 'USD',
        closingDate: data.closingDate,
        createdBy: data.createdBy,
      },
    });

    logger.info(`Job vacancy created: ${vacancy.title} (${vacancy.id})`);
    return vacancy;
  }

  /**
   * List job vacancies with filtering
   */
  async listVacancies(options: {
    status?: string;
    department?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = options;
    const where: any = {};
    if (options.status) where.status = options.status;
    if (options.department) where.department = options.department;

    const [vacancies, total] = await Promise.all([
      prisma.jobVacancy.findMany({
        where,
        include: { applications: { select: { id: true, stage: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobVacancy.count({ where }),
    ]);

    return { vacancies, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Submit a job application
   */
  async submitApplication(data: {
    vacancyId: string;
    candidateName: string;
    candidateEmail: string;
    phone?: string;
    country?: string;
    resumeUrl?: string;
    coverLetter?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    source?: string;
    referredBy?: string;
  }) {
    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id: data.vacancyId },
    });
    if (!vacancy || vacancy.status !== 'OPEN') {
      throw new Error('Vacancy not found or not accepting applications');
    }

    const application = await prisma.jobApplication.create({
      data: {
        vacancyId: data.vacancyId,
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
        phone: data.phone,
        country: data.country,
        resumeUrl: data.resumeUrl,
        coverLetter: data.coverLetter,
        linkedinUrl: data.linkedinUrl,
        portfolioUrl: data.portfolioUrl,
        source: data.source || 'DIRECT',
        referredBy: data.referredBy,
        stage: 'APPLIED',
        stageHistory: JSON.stringify([{
          stage: 'APPLIED',
          timestamp: new Date().toISOString(),
        }]),
      },
    });

    await prisma.jobVacancy.update({
      where: { id: data.vacancyId },
      data: { applicantCount: { increment: 1 } },
    });

    logger.info(`Application received: ${data.candidateName} for ${vacancy.title}`);
    return application;
  }

  /**
   * AI-powered CV scoring against job description
   */
  async scoreApplication(applicationId: string) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { vacancy: true },
    });

    if (!application) throw new Error('Application not found');

    try {
      const prompt = `Score this job application on a scale of 0-100 for three categories.

JOB TITLE: ${application.vacancy.title}
JOB DESCRIPTION: ${application.vacancy.description}
REQUIREMENTS: ${application.vacancy.requirements || 'Not specified'}

CANDIDATE: ${application.candidateName}
COVER LETTER: ${application.coverLetter || 'Not provided'}
PORTFOLIO: ${application.portfolioUrl || 'Not provided'}
LINKEDIN: ${application.linkedinUrl || 'Not provided'}

Respond in JSON format only:
{
  "skillMatch": <0-100>,
  "experienceMatch": <0-100>,
  "cultureMatch": <0-100>,
  "overallScore": <0-100>,
  "summary": "<2-3 sentence assessment>"
}`;

      const response = await complete(prompt, { model: AI_MODELS.FAST });
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const scores = JSON.parse(jsonMatch[0]);

        await prisma.jobApplication.update({
          where: { id: applicationId },
          data: {
            aiScore: scores.overallScore,
            aiSummary: scores.summary,
            skillMatch: scores.skillMatch,
            experienceMatch: scores.experienceMatch,
            cultureMatch: scores.cultureMatch,
            stage: 'AI_SCORED',
            stageHistory: JSON.stringify([
              ...(application.stageHistory ? JSON.parse(application.stageHistory) : []),
              { stage: 'AI_SCORED', timestamp: new Date().toISOString(), score: scores.overallScore },
            ]),
          },
        });

        return scores;
      }
    } catch (error) {
      logger.error('Error scoring application:', error);
    }

    return null;
  }

  /**
   * Move application through pipeline stages
   */
  async updateApplicationStage(applicationId: string, newStage: string, notes?: string) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new Error('Application not found');

    const history = application.stageHistory ? JSON.parse(application.stageHistory) : [];
    history.push({
      stage: newStage,
      timestamp: new Date().toISOString(),
      notes,
    });

    return await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        stage: newStage,
        stageHistory: JSON.stringify(history),
      },
    });
  }

  /**
   * Schedule interview
   */
  async scheduleInterview(applicationId: string, date: Date, interviewerIds: string[]) {
    return await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        interviewDate: date,
        interviewerIds: JSON.stringify(interviewerIds),
        stage: 'INTERVIEW',
        stageHistory: JSON.stringify([
          ...(JSON.parse(
            (await prisma.jobApplication.findUnique({ where: { id: applicationId } }))?.stageHistory || '[]'
          )),
          { stage: 'INTERVIEW', timestamp: new Date().toISOString(), date: date.toISOString() },
        ]),
      },
    });
  }

  /**
   * Create onboarding for new hire
   */
  async createOnboarding(userId: string, applicationId?: string) {
    const defaultChecklist = [
      { id: 'welcome_email', label: 'Welcome email sent', completed: false },
      { id: 'nda_signed', label: 'NDA signed', completed: false },
      { id: 'contract_signed', label: 'Employment contract signed', completed: false },
      { id: 'id_uploaded', label: 'ID document uploaded', completed: false },
      { id: 'system_access', label: 'System access provisioned', completed: false },
      { id: 'training_assigned', label: 'Training modules assigned', completed: false },
      { id: 'buddy_assigned', label: 'Buddy assigned', completed: false },
      { id: 'first_task', label: 'First task assigned', completed: false },
    ];

    return await prisma.staffOnboarding.create({
      data: {
        userId,
        applicationId,
        status: 'IN_PROGRESS',
        startDate: new Date(),
        checklist: JSON.stringify(defaultChecklist),
      },
    });
  }

  /**
   * Get HR dashboard stats
   */
  async getHRStats() {
    const [
      openVacancies,
      totalApplications,
      pendingReview,
      interviewsScheduled,
      onboardingInProgress,
    ] = await Promise.all([
      prisma.jobVacancy.count({ where: { status: 'OPEN' } }),
      prisma.jobApplication.count(),
      prisma.jobApplication.count({ where: { stage: 'APPLIED' } }),
      prisma.jobApplication.count({ where: { stage: 'INTERVIEW' } }),
      prisma.staffOnboarding.count({ where: { status: 'IN_PROGRESS' } }),
    ]);

    const applicationsByStage = await prisma.jobApplication.groupBy({
      by: ['stage'],
      _count: true,
    });

    return {
      openVacancies,
      totalApplications,
      pendingReview,
      interviewsScheduled,
      onboardingInProgress,
      applicationsByStage,
    };
  }
}

export default new HRService();
