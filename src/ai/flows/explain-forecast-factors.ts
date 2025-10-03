'use server';

/**
 * @fileOverview Provides insights into top factors impacting the current forecast using a tool with feature importance analysis and action recommendations.
 *
 * - explainForecastFactors - A function that handles the explanation of forecast factors.
 * - ExplainForecastFactorsInput - The input type for the explainForecastFactors function.
 * - ExplainForecastFactorsOutput - The return type for the explainForecastFactors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainForecastFactorsInputSchema = z.object({
  city: z.string().describe('The city for which to explain the forecast factors.'),
  dateTime: z.string().describe('The date and time for which to explain the forecast factors.'),
});
export type ExplainForecastFactorsInput = z.infer<typeof ExplainForecastFactorsInputSchema>;

const ExplainForecastFactorsOutputSchema = z.object({
  explanation: z.string().describe('Explanation of the key factors influencing the air quality forecast.'),
  recommendations: z.string().describe('Actionable recommendations based on the forecast factors.'),
});
export type ExplainForecastFactorsOutput = z.infer<typeof ExplainForecastFactorsOutputSchema>;

export async function explainForecastFactors(input: ExplainForecastFactorsInput): Promise<ExplainForecastFactorsOutput> {
  return explainForecastFactorsFlow(input);
}

const explainForecastFactorsPrompt = ai.definePrompt({
  name: 'explainForecastFactorsPrompt',
  input: {schema: ExplainForecastFactorsInputSchema},
  output: {schema: ExplainForecastFactorsOutputSchema},
  prompt: `You are an expert air quality analyst. Provide a concise explanation of the key factors influencing the air quality forecast for {{city}} at {{dateTime}}. Also, provide actionable recommendations based on these factors.\n\nExplanation (3-4 sentences):\nRecommendations (1-2 bullet points):`,
});

const explainForecastFactorsFlow = ai.defineFlow(
  {
    name: 'explainForecastFactorsFlow',
    inputSchema: ExplainForecastFactorsInputSchema,
    outputSchema: ExplainForecastFactorsOutputSchema,
  },
  async input => {
    const {output} = await explainForecastFactorsPrompt(input);
    return output!;
  }
);
