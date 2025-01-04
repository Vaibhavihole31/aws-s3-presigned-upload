import express from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import cors from 'cors';


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  app.post('/api/generate-upload-url', async (req, res) => {
    try {
      const { fileName, fileType } = req.body;
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${fileName}`,
        ContentType: fileType,
      });

      console.log("command",command);
      
      
      const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      res.json({ uploadURL });
      console.log("uploadURL",uploadURL);
      
    } catch (error) {
      console.error('Error generating upload URL:', error);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });

  app.get('/api/files', async (req, res) => {
    try {
      const command = new ListObjectsV2Command({
        Bucket: process.env.AWS_BUCKET_NAME,
        Prefix: 'uploads/'
      });
  
      const { Contents } = await s3Client.send(command);
      const files = Contents
        .filter(item => item.Size > 0) // Filter out folders
        .map(item => ({
          name: item.Key.replace('uploads/', ''),
          size: item.Size,
          lastModified: item.LastModified
        }));
  
      res.json(files);
    } catch (error) {
      console.error('Error listing files:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });
  


  app.get('/api/generate-download-url/:fileName', async (req, res) => {
    try {
      const { fileName } = req.params;
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${fileName}`,
        ResponseContentDisposition: `attachment; filename="${fileName}"`, // Forces download
      });
      
      const downloadURL = await getSignedUrl(s3Client, command, { 
        expiresIn: 3600 
      });
      
      res.json({ downloadURL });
    } catch (error) {
      console.error('Error generating download URL:', error);
      res.status(500).json({ error: 'Failed to generate download URL' });
    }
  });
  

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} 🚀`);
});