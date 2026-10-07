using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Domain.Entities
{
    public class Attachment
    {
        public int AttachmentId { get; set; }
        public int TicketId { get; set; }
        public int? MessageId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public DateTime UploadedOn { get; set; } = DateTime.Now;

        public Ticket Ticket { get; set; } = null!;
        public Message? Message { get; set; }
    }
}
