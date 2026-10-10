using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Application.Interfaces
{
    public class AIAnalysisResult
    {
        public string Category { get; set; } = "Other";
        public string Priority { get; set; } = "Low";
        public string SuggestedResponse { get; set; } = string.Empty;
    }

    public interface IAIProvider
    {
        Task<AIAnalysisResult> AnalyzeTicketAsync(string subject, string description, CancellationToken cancellationToken = default);
    }
}
