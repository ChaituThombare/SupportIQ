using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Domain.Entities
{
    public class Ticket
    {
        public int TicketId { get; set; }
        public int CustomerId { get; set; }
        public int? AssignedAgentId { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
        public string Priority { get; set; } = "Low";
        public string Status { get; set; } = "Open";
        public bool IsAIClassified { get; set; } = false;
        public DateTime CreatedOn { get; set; } = DateTime.Now;
        public DateTime? UpdatedOn { get; set; }
        public DateTime? ResolvedOn { get; set; }

        public User Customer { get; set; } = null!;
        public User? AssignedAgent { get; set; }
        public Category? Category { get; set; }
        public ICollection<Message> Messages { get; set; } = new List<Message>();
        public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    }
}
