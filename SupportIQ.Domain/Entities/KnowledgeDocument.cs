using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Domain.Entities
{
    public class KnowledgeDocument
    {
        public int DocumentId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public int UploadedBy { get; set; }
        public DateTime UploadedOn { get; set; } = DateTime.Now;
        public string Status { get; set; } = "Processing";

        public User Uploader { get; set; } = null!;
        public ICollection<KnowledgeChunk> Chunks{ get; set; } = new List<KnowledgeChunk>();
    }
}
