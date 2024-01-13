package com.example.chatserver.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.sas.BlobSasPermission;
import com.azure.storage.blob.sas.BlobServiceSasSignatureValues;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class AzureBlobService {

    private final BlobServiceClient blobServiceClient;
    @Value("${spring.azure.blob.container.name}")
    private String containerName;
    @Value("${spring.azure.blob.container.connection.string}")
    private String connectionString;


    @Autowired
    public AzureBlobService(BlobServiceClient blobServiceClient) {
        this.blobServiceClient = blobServiceClient;
    }

    public String uploadFileToBlob(String blobName, InputStream inputStream, long contentLength) {
        blobName = UUID.randomUUID() + blobName;
        BlobClient blobClient = blobServiceClient.getBlobContainerClient(containerName).getBlobClient(blobName);
        blobClient.upload(inputStream, contentLength);
        return blobName;
    }

    public ByteArrayOutputStream downloadFileFromBlob(String containerName, String blobName) throws IOException {
        BlobClient blobClient = blobServiceClient.getBlobContainerClient(containerName).getBlobClient(blobName);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        blobClient.download(outputStream);
        return outputStream;
    }

    public String generateSasToken(String blobName) {
        BlobServiceClient blobServiceClient = new BlobServiceClientBuilder().connectionString(connectionString)
                .buildClient();

        // Get a reference to a container
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);

        // Get a reference to a blob
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        // Set the SAS token permissions to read
        BlobServiceSasSignatureValues sasValues = new BlobServiceSasSignatureValues(
                OffsetDateTime.now().plusDays(1000), // Set the expiry time
                BlobSasPermission.parse("r") // Set the permission to read
        );

        // Generate the SAS token for the blob
        String sasToken = blobClient.generateSas(sasValues);

        // Print the blob URL with the SAS token
        String blobUrlWithSas = blobClient.getBlobUrl() + "?" + sasToken;
        return blobUrlWithSas;
    }
}
