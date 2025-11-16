import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { patientService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Feature from '../../components/common/Feature'
import {
    DocumentPlusIcon,
    ArrowDownTrayIcon,
    TrashIcon,
    DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const documentTypes = ["prescription", "lab_result", "vaccination_record", "medical_image", "other"];

// Manual Upload Modal Component
const UploadDocumentModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const { t } = useTranslation();
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [isUploading, setIsUploading] = useState(false);

    const onSubmit = async (data) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('document_type', data.document_type);
        formData.append('description', data.description || '');
        formData.append('file', data.file[0]);

        try {
            await patientService.uploadDocument(formData);
            toast.success("Document uploaded successfully!");
            onUploadSuccess();
            onClose();
            reset();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">{t('records.upload_new')}</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">{t('records.doc_type')}</label>
                        <select {...register('document_type', { required: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:border-dortmed-500 focus:ring-dortmed-500">
                            {documentTypes.map(type => <option key={type} value={type}>{t(`records.types.${type}`)}</option>)}
                        </select>
                    </div>
                    <Input label={t('records.description')} name="description" {...register('description')} />
                    <div>
                        <label className="block text-sm font-medium">{t('records.file_select')}</label>
                        <input type="file" {...register('file', { required: "Please select a file" })} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-dortmed-50 file:text-dortmed-700 hover:file:bg-dortmed-100" />
                        {errors.file && <p className="text-danger mt-1 text-sm">{errors.file.message}</p>}
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                        <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button type="submit" isLoading={isUploading}>{t('common.upload')}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const MedicalRecords = () => {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth(); // Assuming refreshUser updates user context
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);

    // --- State for OCR Flow ---
    const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
    const [ocrResult, setOcrResult] = useState(null);
    const [ocrFile, setOcrFile] = useState(null);
    const [isOcrLoading, setIsOcrLoading] = useState(false);

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await patientService.getDocuments();
            setDocuments(response.data);
        } catch (error) {
            toast.error("Failed to fetch documents.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // --- OCR Handler Functions ---
    const handleOcrUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsOcrLoading(true);
        setOcrResult(null); // Clear previous results
        setOcrFile(file); // Store the original file for later

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await patientService.processOcr(formData);
            setOcrResult(response.data);
            toast.success("Data extracted successfully! Please review.");
        } catch (error) {
            toast.error(error.response?.data?.detail || "OCR processing failed.");
            closeOcrModal(); // Close modal on failure
        } finally {
            setIsOcrLoading(false);
        }
    };

    const handleConfirmOcrData = async () => {
        setIsOcrLoading(true);
        const formData = new FormData();
        formData.append('document_type', 'lab_result');
        const description = `OCR Upload: ${ocrResult.filename}. Extracted Fields: ${Object.keys(ocrResult.structured_data).join(', ')}`;
        formData.append('description', description);
        formData.append('file', ocrFile);

        try {
            await patientService.uploadDocument(formData);
            toast.success("Lab result and file saved successfully!");
            fetchDocuments(); // Refresh the main document list
            closeOcrModal();
        } catch (error) {
            toast.error("Failed to save the document.");
        } finally {
            setIsOcrLoading(false);
        }
    };

    const closeOcrModal = () => {
        setIsOcrModalOpen(false);
        setOcrResult(null);
        setOcrFile(null);
    };

    // --- OCR Modal Component ---
    const OcrModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Extract Lab Data with OCR</h2>

                {isOcrLoading && (
                     <div className="text-center p-8">
                        <div className="w-12 h-12 border-4 border-dortmed-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4">Processing image... This may take a moment.</p>
                    </div>
                )}

                {!ocrResult && !isOcrLoading && (
                    <div>
                        <p className="text-gray-600 dark:text-gray-400">Upload an image of your lab result to automatically extract key information. Please ensure the image is clear and well-lit.</p>
                        <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleOcrUpload} className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-dortmed-50 file:text-dortmed-700 hover:file:bg-dortmed-100"/>
                        <div className="flex justify-end mt-6">
                            <Button variant="secondary" onClick={closeOcrModal}>Cancel</Button>
                        </div>
                    </div>
                )}

                {ocrResult && !isOcrLoading && (
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Please review and confirm the extracted data:</h3>
                        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md max-h-60 overflow-y-auto">
                            {Object.keys(ocrResult.structured_data).length > 0 ? (
                                <ul className="list-disc pl-5 space-y-1">
                                    {Object.entries(ocrResult.structured_data).map(([key, value]) => (
                                        <li key={key}>
                                            <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>
                                            <span className="font-mono ml-2 p-1 bg-gray-200 dark:bg-gray-600 rounded-sm">{value}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-center text-gray-500">Could not find any structured data from the image. You can still save the file with its raw text content.</p>}
                        </div>
                         <div className="flex justify-end space-x-4 mt-6">
                            <Button variant="secondary" onClick={closeOcrModal}>Cancel</Button>
                            <Button isLoading={isOcrLoading} onClick={handleConfirmOcrData}>Confirm and Save File</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <AnimatedWrapper>
            <UploadDocumentModal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} onUploadSuccess={fetchDocuments} />
            {isOcrModalOpen && <OcrModal />}

            <div className="space-y-10">
                <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('records.title')}</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('records.subtitle')}</p>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0">
    <Feature name="OCR_UPLOAD">
        <Button onClick={() => setIsOcrModalOpen(true)}>
            <DocumentMagnifyingGlassIcon className="w-5 h-5 mr-2" />
            Upload with OCR
        </Button>
    </Feature>
    <Button variant="secondary" onClick={() => setIsManualModalOpen(true)}>
        <DocumentPlusIcon className="w-5 h-5 mr-2" />
        Manual Upload
    </Button>
</div>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('records.documents_title')}</h2>
                    </div>
                    <div className="p-6">
                        {loading ? <p>Loading documents...</p> : documents.length > 0 ? (
                             <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {documents.map(doc => (
                                    <li key={doc.id} className="py-4 flex items-center justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-dortmed-700 dark:text-dortmed-300 truncate">{doc.file_name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {t(`records.types.${doc.document_type}`)} - Uploaded on {new Date(doc.upload_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-3 flex-shrink-0">
                                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-dortmed-600 dark:hover:text-dortmed-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <ArrowDownTrayIcon className="w-5 h-5" />
                                            </a>
                                            <button className="p-2 text-gray-500 hover:text-danger rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">{t('records.no_documents')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default MedicalRecords;