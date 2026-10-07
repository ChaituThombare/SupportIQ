using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Domain.Entities
{
    public class Message
    {
        public int MessageId { get; set; }
        public int TicketId { get; set; }
        public int SenderId { get; set; }
        public string SenderType { get; set; } = string.Empty;
        public string MessageText { get; set; } = string.Empty;
        public bool IsAISuggested { get; set; } = false;
        public DateTime CreatedOn { get; set; } = DateTime.Now;

        public Ticket Ticket { get; set; } = null!;
        public User Sender { get; set; } = null!;
        public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    }
}
