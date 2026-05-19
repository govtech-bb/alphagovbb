import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const FeedbackSchema = z
  .object({
    visitReason: z.string(),
    whatWentWrong: z.string(),
    referrer: z.string().optional().default(''),
  })
  .refine((d) => d.visitReason.trim() || d.whatWentWrong.trim(), {
    message: 'At least one feedback field is required',
    path: ['visitReason'],
  })

export type FeedbackState = {
  error: string | null
  fieldErrors?: Record<string, string>
  success?: boolean
}

export const sendFeedback = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => raw as Record<string, unknown>)
  .handler(async ({ data }): Promise<FeedbackState> => {
    const parsed = FeedbackSchema.safeParse(data)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string' && !(key in fieldErrors)) {
          fieldErrors[key] = issue.message
        }
      }
      return { error: null, fieldErrors }
    }

    const mailFrom = process.env.MAIL_FROM
    const feedbackToEmail = process.env.FEEDBACK_TO_EMAIL
    if (!mailFrom) {
      return { error: 'MAIL_FROM environment variable is required' }
    }
    if (!feedbackToEmail) {
      return { error: 'FEEDBACK_TO_EMAIL environment variable is required' }
    }
    const region = process.env.SES_REGION ?? 'us-east-1'
    const configurationSet = process.env.SES_CONFIGURATION_SET
    const tagKey = process.env.SES_TAG_KEY ?? 'ses:configuration-set'
    const tagValue = process.env.SES_TAG_VALUE ?? 'prod'

    const { visitReason, whatWentWrong, referrer } = parsed.data
    const siteUrl = process.env.SITE_URL ?? 'https://alpha.gov.bb'
    const referrerUrl = referrer
      ? new URL(referrer, siteUrl).toString()
      : null
    const html = [
      referrerUrl &&
        `<p><strong>Page:</strong> <a href="${referrerUrl}">${referrerUrl}</a></p>`,
      `<p><strong>Why did you visit alpha.gov.bb?</strong></p><p>${visitReason.replace(/\n/g, '<br>')}</p>`,
      `<p><strong>What went wrong?</strong></p><p>${whatWentWrong.replace(/\n/g, '<br>')}</p>`,
      '<hr><p><em>Sent from alpha.gov.bb Feedback Form</em></p>',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      const { SESv2Client, SendEmailCommand } = await import(
        '@aws-sdk/client-sesv2'
      )
      const client = new SESv2Client({ region })
      await client.send(
        new SendEmailCommand({
          FromEmailAddress: mailFrom,
          Destination: { ToAddresses: [feedbackToEmail] },
          ...(configurationSet && {
            ConfigurationSetName: configurationSet,
            EmailTags: [{ Name: tagKey, Value: tagValue }],
          }),
          Content: {
            Simple: {
              Subject: { Data: 'alpha.gov.bb Feedback' },
              Body: { Html: { Data: html } },
            },
          },
        }),
      )
    } catch (error) {
      console.error('Feedback email failed:', error)
      return {
        error:
          error instanceof Error ? error.message : 'Failed to send feedback',
      }
    }

    return { error: null, success: true }
  })
