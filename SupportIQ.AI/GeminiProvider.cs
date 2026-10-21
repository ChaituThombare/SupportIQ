using Microsoft.Extensions.Configuration;
using SupportIQ.Application.Interfaces;
using System.Net;
using System.Text;
using System.Text.Json;

namespace SupportIQ.AI
{
    public class GeminiProvider : IAIProvider
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public GeminiProvider(
            HttpClient httpClient,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<AIAnalysisResult> AnalyzeTicketAsync(
            string subject,
            string description,
            CancellationToken cancellationToken = default)
        {
            var apiKey = _configuration["AI:ApiKey"]?.Trim();

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new InvalidOperationException(
                    "Gemini API key is not configured. Set AI:ApiKey using User Secrets or an environment variable.");
            }

            var model = _configuration["AI:Model"]?.Trim();

            if (string.IsNullOrWhiteSpace(model))
            {
                model = "gemini-3.6-flash";
            }

            var url =
                $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";

            // Keep the prompt focused to reduce unnecessary token generation.
            var requestBody = new
            {
                systemInstruction = new
                {
                    parts = new[]
                    {
                        new
                        {
                            text = """
                                You are an expert customer-support ticket classification assistant.

                                Analyze the customer's ticket and return only a valid JSON object
                                containing Category, Priority, and SuggestedResponse.

                                Allowed categories:
                                Payment, Order, Delivery, Product, Refund, Account, Technical, Other.

                                Allowed priorities:
                                Low, Medium, High, Critical.

                                Priority guidelines:
                                - Critical: Severe outage, security incident, widespread impact,
                                  or serious consequences requiring immediate attention.
                                - High: Significant customer impact, blocked essential functionality,
                                  failed important transactions, or a genuine urgent deadline.
                                - Medium: A normal issue with a reasonable workaround.
                                - Low: A minor inconvenience, general question, or non-urgent request.

                                Assess actual impact and urgency. Do not automatically assign
                                High or Critical because the customer uses words such as urgent.
                                Do not invent facts or deadlines.

                                SuggestedResponse must be a polite draft for a human agent to review.
                                Never claim that an action has already been completed.

                                Return valid JSON only. Do not include Markdown or explanations.
                                """
                        }
                    }
                },
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[]
                        {
                            new
                            {
                                text = $"""
                                    Current date and time:
                                    {DateTimeOffset.Now:yyyy-MM-dd HH:mm:ss zzz}

                                    Subject: {subject}

                                    Description: {description}
                                    """
                            }
                        }
                    }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json",
                    temperature = 0.2,
                    maxOutputTokens = 512
                }
            };

            // Serialize once. A fresh HTTP request/content is created on each retry.
            var requestJson = JsonSerializer.Serialize(requestBody);

            using var timeoutCts =
                CancellationTokenSource.CreateLinkedTokenSource(
                    cancellationToken);

            // Total time limit, including retries and backoff delays.
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(55));

            const int maxAttempts = 3;

            for (var attempt = 1; attempt <= maxAttempts; attempt++)
            {
                timeoutCts.Token.ThrowIfCancellationRequested();

                using var request = new HttpRequestMessage(
                    HttpMethod.Post,
                    url);

                request.Headers.Add("x-goog-api-key", apiKey);

                request.Content = new StringContent(
                    requestJson,
                    Encoding.UTF8,
                    "application/json");

                HttpResponseMessage response;

                try
                {
                    response = await _httpClient.SendAsync(
                        request,
                        HttpCompletionOption.ResponseHeadersRead,
                        timeoutCts.Token);
                }
                catch (OperationCanceledException)
                    when (!cancellationToken.IsCancellationRequested)
                {
                    // The overall timeout expired, rather than the caller cancelling.
                    throw;
                }
                catch (HttpRequestException ex)
                    when (ex.StatusCode is null && attempt < maxAttempts)
                {
                    // Retry network failures, but only a limited number of times.
                    await Task.Delay(
                        TimeSpan.FromSeconds(
                            Math.Pow(2, attempt - 1)),
                        timeoutCts.Token);

                    continue;
                }
                catch (HttpRequestException ex)
                {
                    throw new HttpRequestException(
                        $"Could not reach Gemini after {attempt} attempt(s): {ex.Message}",
                        ex,
                        ex.StatusCode);
                }

                using (response)
                {
                    if (response.IsSuccessStatusCode)
                    {
                        await using var responseStream =
                            await response.Content.ReadAsStreamAsync(
                                timeoutCts.Token);

                        using var document =
                            await JsonDocument.ParseAsync(
                                responseStream,
                                cancellationToken: timeoutCts.Token);

                        return ParseResponse(document.RootElement);
                    }

                    var errorBody =
                        await response.Content.ReadAsStringAsync(
                            timeoutCts.Token);

                    var statusCode = response.StatusCode;
                    var statusNumber = (int)statusCode;

                    var isTransient =
                        statusCode == HttpStatusCode.RequestTimeout ||
                        statusNumber >= 500;

                    if (isTransient && attempt < maxAttempts)
                    {
                        response.Dispose();

                        // Retry transient timeouts and server errors with exponential backoff.
                        await Task.Delay(
                            TimeSpan.FromSeconds(
                                Math.Pow(2, attempt - 1)),
                            timeoutCts.Token);

                        continue;
                    }

                    // Includes the original upstream error in the backend log
                    // via the exception. The controller returns a safe message.
                    throw new HttpRequestException(
                        $"Gemini API returned HTTP {statusNumber} " +
                        $"({response.ReasonPhrase}). Response body: {errorBody}",
                        null,
                        statusCode);
                }
            }

            throw new InvalidOperationException(
                "Gemini analysis ended without a successful response.");
        }

        private static AIAnalysisResult ParseResponse(JsonElement root)
        {
            if (!root.TryGetProperty("candidates", out var candidates) ||
                candidates.ValueKind != JsonValueKind.Array ||
                candidates.GetArrayLength() == 0)
            {
                var blockReason = "unknown";

                if (root.TryGetProperty("promptFeedback", out var feedback) &&
                    feedback.TryGetProperty("blockReason", out var block))
                {
                    blockReason = block.GetString() ?? "unknown";
                }

                throw new InvalidOperationException(
                    $"Gemini returned no candidates. Block reason: {blockReason}.");
            }

            var candidate = candidates[0];

            var finishReason =
                candidate.TryGetProperty("finishReason", out var finish)
                    ? finish.GetString() ?? "unknown"
                    : "unknown";

            if (!candidate.TryGetProperty("content", out var content) ||
                !content.TryGetProperty("parts", out var parts) ||
                parts.ValueKind != JsonValueKind.Array)
            {
                throw new InvalidOperationException(
                    $"Gemini returned no text content. Finish reason: {finishReason}.");
            }

            var textParts = new List<string>();

            foreach (var part in parts.EnumerateArray())
            {
                if (part.TryGetProperty("text", out var textElement))
                {
                    var partText = textElement.GetString();

                    if (!string.IsNullOrWhiteSpace(partText))
                    {
                        textParts.Add(partText);
                    }
                }
            }

            var json = string.Join("\n", textParts).Trim();

            if (string.IsNullOrWhiteSpace(json))
            {
                throw new InvalidOperationException(
                    $"Gemini returned empty text. Finish reason: {finishReason}.");
            }

            AIAnalysisResult? result;

            try
            {
                result = JsonSerializer.Deserialize<AIAnalysisResult>(
                    json,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
            }
            catch (JsonException ex)
            {
                throw new InvalidOperationException(
                    "Gemini returned text that could not be parsed as JSON.",
                    ex);
            }

            if (result is null ||
                string.IsNullOrWhiteSpace(result.Category) ||
                string.IsNullOrWhiteSpace(result.Priority) ||
                string.IsNullOrWhiteSpace(result.SuggestedResponse))
            {
                throw new InvalidOperationException(
                    "Gemini JSON is missing Category, Priority, or SuggestedResponse.");
            }

            return result;
        }
    }
}
