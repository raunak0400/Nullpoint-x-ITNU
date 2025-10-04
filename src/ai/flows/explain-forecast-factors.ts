
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
  no2: z.number().describe('The current average Nitrogen dioxide (NO₂) level in µg/m³.'),
  ch2o: z.number().describe('The current average Formaldehyde (CH₂O) level in µg/m³.'),
  aerosol: z.number().describe('The current average Aerosol Index.'),
  pm: z.number().describe('The current average Particulate Matter (PM) level in µg/m³.'),
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
  prompt: `You are an expert air quality analyst. Based on the following data for {{city}} at {{dateTime}}, provide a concise explanation of the key factors influencing the air quality forecast and provide actionable recommendations.

Current Air Quality Data:
- Nitrogen dioxide (NO₂): {{no2}} µg/m³
- Formaldehyde (CH₂O): {{ch2o}} µg/m³
- Aerosol Index: {{aerosol}}
- Particulate Matter (PM): {{pm}} µg/m³

Your explanation should be 3-4 sentences and focus on the most significant pollutants.
Your recommendations should be 1-2 bullet points based on the data.`,
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
