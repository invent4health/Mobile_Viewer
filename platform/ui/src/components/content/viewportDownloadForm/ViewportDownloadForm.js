// import React, {
//   useRef,
//   useCallback,
//   useEffect,
//   useState,
//   createRef,
// } from 'react';
// import PropTypes from 'prop-types';
// import { useTranslation } from 'react-i18next';
// import './ViewportDownloadForm.styl';
// import { TextInput, Select, Icon } from '@ohif/ui';
// import classnames from 'classnames';
// import jsPDF from 'jspdf';
// import OHIF from '@ohif/core';

// const DEFAULT_FILENAME = 'image';
// const REFRESH_VIEWPORT_TIMEOUT = 1000;

// const FILE_TYPE_OPTIONS = [
//   { key: 'jpg', value: 'jpg' },
//   { key: 'png', value: 'png' },
//   { key: 'pdf', value: 'pdf' },
// ];

// const ViewportDownloadForm = ({
//   activeViewport,
//   onClose,
//   updateViewportPreview,
//   enableViewport,
//   disableViewport,
//   toggleAnnotations,
//   loadImage,
//   downloadBlob,
//   defaultSize,
//   minimumSize,
//   maximumSize,
//   canvasClass,
//   activeViewportIndex, // Add this prop to get viewport index
// }) => {
//   const [t] = useTranslation('ViewportDownloadForm');

//   const [filename, setFilename] = useState(DEFAULT_FILENAME);
//   const [fileType, setFileType] = useState('png');
//   const [dimensions, setDimensions] = useState({
//     width: defaultSize,
//     height: defaultSize,
//   });
//   const [showAnnotations, setShowAnnotations] = useState(true);
//   const [keepAspect, setKeepAspect] = useState(true);
//   const [aspectMultiplier, setAspectMultiplier] = useState({
//     width: 1,
//     height: 1,
//   });
//   const [viewportElement, setViewportElement] = useState();
//   const [viewportElementDimensions, setViewportElementDimensions] = useState({
//     width: defaultSize,
//     height: defaultSize,
//   });
//   const [downloadCanvas, setDownloadCanvas] = useState({
//     ref: createRef(),
//     width: defaultSize,
//     height: defaultSize,
//   });
//   const [viewportPreview, setViewportPreview] = useState({
//     src: null,
//     width: defaultSize,
//     height: defaultSize,
//   });
//   const [error, setError] = useState({
//     width: false,
//     height: false,
//     filename: false,
//   });

//   const hasError = Object.values(error).includes(true);
//   const refreshViewport = useRef(null);

//   // Helper function to get patient information
//   const getPatientInfo = () => {
//     try {
//       const { studyMetadataManager } = OHIF.utils;

//       // Get the current viewport data from Redux store
//       const state = window.store.getState();
//       const viewports = state.viewports;

//       if (!viewports || !viewports.viewportSpecificData) {
//         console.warn('No viewport data available');
//         return { patientName: 'Unknown', patientId: 'Unknown' };
//       }

//       // Use activeViewportIndex or fallback to 0
//       const viewportIndex =
//         activeViewportIndex !== undefined ? activeViewportIndex : 0;
//       const viewportData = viewports.viewportSpecificData[viewportIndex];

//       if (!viewportData || !viewportData.StudyInstanceUID) {
//         console.warn('No StudyInstanceUID found in viewport data');
//         return { patientName: 'Unknown', patientId: 'Unknown' };
//       }

//       // Get study metadata
//       const study = studyMetadataManager.get(viewportData.StudyInstanceUID);

//       if (!study || !study._data) {
//         console.warn('No study metadata found');
//         return { patientName: 'Unknown', patientId: 'Unknown' };
//       }

//       return {
//         patientName: study._data.PatientName || 'Unknown',
//         patientId: study._data.PatientID || 'Unknown',
//       };
//     } catch (error) {
//       console.error('Error getting patient info:', error);
//       return { patientName: 'Unknown', patientId: 'Unknown' };
//     }
//   };

//   const generatePDF = (canvas, filename) => {
//     const imgData = canvas.toDataURL('image/jpeg', 1.0);
//     const pdf = new jsPDF({ orientation: 'landscape' });
//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();

//     // Get patient information using the corrected approach
//     const { patientName, patientId } = getPatientInfo();

//     // Add patient info at the top
//     pdf.text(`Patient Name: ${patientName}`, 10, 10);
//     pdf.text(`Patient ID: ${patientId}`, 10, 18);

//     // Calculate available space for image (leaving margins and space for patient info)
//     const availableWidth = pageWidth - 20; // 10px margin on each side
//     const availableHeight = pageHeight - 40; // 25px from top for patient info + 15px bottom margin
//     const imageStartY = 25; // Start image below patient info

//     // Get canvas dimensions
//     const canvasWidth = canvas.width;
//     const canvasHeight = canvas.height;
//     const canvasAspectRatio = canvasWidth / canvasHeight;

//     // Calculate image dimensions while maintaining aspect ratio
//     let imageWidth, imageHeight;

//     if (canvasAspectRatio > availableWidth / availableHeight) {
//       // Image is wider relative to available space - fit to width
//       imageWidth = availableWidth;
//       imageHeight = availableWidth / canvasAspectRatio;
//     } else {
//       // Image is taller relative to available space - fit to height
//       imageHeight = availableHeight;
//       imageWidth = availableHeight * canvasAspectRatio;
//     }

//     // Center the image horizontally
//     const imageX = (pageWidth - imageWidth) / 2;

//     // Add the image with calculated dimensions
//     pdf.addImage(imgData, 'JPEG', imageX, imageStartY, imageWidth, imageHeight);
//     pdf.save(`${filename || DEFAULT_FILENAME}.pdf`);
//   };

//   const downloadImage = async () => {
//     await loadAndUpdateViewports();

//     const canvas = downloadCanvas.ref.current;
//     if (!canvas) {
//       console.warn('Canvas not ready');
//       return;
//     }

//     if (fileType === 'pdf') {
//       generatePDF(canvas, filename);
//     } else {
//       downloadBlob(
//         filename || DEFAULT_FILENAME,
//         fileType,
//         viewportElement,
//         canvas
//       );
//     }
//   };

//   const onDimensionsChange = (event, dimension) => {
//     const opposite = dimension === 'height' ? 'width' : 'height';
//     const value = event.target.value.replace(/\D/, '');
//     const isEmpty = value === '';
//     const updated = isEmpty ? '' : Math.min(value, maximumSize);

//     if (updated === dimensions[dimension]) return;

//     const newDims = { ...dimensions, [dimension]: updated };

//     if (keepAspect && newDims[opposite] !== '') {
//       newDims[opposite] = Math.round(updated * aspectMultiplier[opposite]);
//     }

//     setDimensions(newDims);

//     if (!isEmpty) {
//       setViewportElementDimensions(newDims);
//       setDownloadCanvas(state => ({ ...state, ...newDims }));
//     }
//   };

//   const error_messages = {
//     width: t('minWidthError'),
//     height: t('minHeightError'),
//     filename: t('emptyFilenameError'),
//   };

//   const renderErrorHandler = type =>
//     error[type] && <div className="input-error">{error_messages[type]}</div>;

//   const onKeepAspectToggle = () => {
//     const { width, height } = dimensions;
//     const base = Math.min(width, height);
//     setAspectMultiplier({
//       width: width / base,
//       height: height / base,
//     });
//     setKeepAspect(!keepAspect);
//   };

//   const validSize = value => (value >= minimumSize ? value : minimumSize);

//   const loadAndUpdateViewports = useCallback(async () => {
//     const { width, height } = await loadImage(
//       activeViewport,
//       viewportElement,
//       dimensions.width,
//       dimensions.height
//     );

//     toggleAnnotations(showAnnotations, viewportElement);

//     const scaled = {
//       height: validSize(height),
//       width: validSize(width),
//     };

//     setViewportElementDimensions(scaled);
//     setDownloadCanvas(state => ({ ...state, ...scaled }));

//     const {
//       dataUrl,
//       width: vpWidth,
//       height: vpHeight,
//     } = await updateViewportPreview(
//       viewportElement,
//       downloadCanvas.ref.current,
//       fileType
//     );

//     setViewportPreview({
//       src: dataUrl,
//       width: validSize(vpWidth),
//       height: validSize(vpHeight),
//     });
//   }, [
//     activeViewport,
//     viewportElement,
//     showAnnotations,
//     loadImage,
//     toggleAnnotations,
//     updateViewportPreview,
//     fileType,
//   ]);

//   useEffect(() => {
//     enableViewport(viewportElement);
//     return () => disableViewport(viewportElement);
//   }, [viewportElement, enableViewport, disableViewport]);

//   useEffect(() => {
//     if (refreshViewport.current !== null) {
//       clearTimeout(refreshViewport.current);
//     }
//     refreshViewport.current = setTimeout(() => {
//       refreshViewport.current = null;
//       loadAndUpdateViewports();
//     }, REFRESH_VIEWPORT_TIMEOUT);
//   }, [dimensions, fileType, showAnnotations, viewportElement]);

//   useEffect(() => {
//     const { width, height } = dimensions;
//     setError({
//       width: width < minimumSize,
//       height: height < minimumSize,
//       filename: !filename,
//     });
//   }, [dimensions, filename]);

//   return (
//     <div className="ViewportDownloadForm">
//       <div className="title">{t('formTitle')}</div>
//       <div className="file-info-container" data-cy="file-info-container">
//         <div className="dimension-wrapper">
//           <div className="dimensions">
//             <div className="width">
//               <TextInput
//                 type="number"
//                 min={minimumSize}
//                 max={maximumSize}
//                 value={dimensions.width}
//                 label={t('imageWidth')}
//                 onChange={evt => onDimensionsChange(evt, 'width')}
//                 data-cy="image-width"
//               />
//               {renderErrorHandler('width')}
//             </div>
//             <div className="height">
//               <TextInput
//                 type="number"
//                 min={minimumSize}
//                 max={maximumSize}
//                 value={dimensions.height}
//                 label={t('imageHeight')}
//                 onChange={evt => onDimensionsChange(evt, 'height')}
//                 data-cy="image-height"
//               />
//               {renderErrorHandler('height')}
//             </div>
//           </div>
//           <div className="keep-aspect-wrapper">
//             <button
//               id="keep-aspect"
//               className={classnames('form-button btn', keepAspect && 'active')}
//               data-cy="keep-aspect"
//               alt={t('keepAspectRatio')}
//               onClick={onKeepAspectToggle}
//             >
//               <Icon name={keepAspect ? 'link' : 'unlink'} />
//             </button>
//           </div>
//         </div>
//         <div className="col">
//           <div className="file-name">
//             <TextInput
//               type="text"
//               value={filename}
//               onChange={event => setFilename(event.target.value)}
//               label={t('filename')}
//               data-cy="file-name"
//               id="file-name"
//             />
//             {renderErrorHandler('filename')}
//           </div>
//           <div className="file-type">
//             <Select
//               value={fileType}
//               onChange={event => setFileType(event.target.value)}
//               options={FILE_TYPE_OPTIONS}
//               label={t('fileType')}
//               data-cy="file-type"
//             />
//           </div>
//         </div>
//         <div className="col">
//           <label htmlFor="show-annotations" className="form-check-label">
//             <input
//               id="show-annotations"
//               type="checkbox"
//               className="form-check-input"
//               checked={showAnnotations}
//               onChange={e => setShowAnnotations(e.target.checked)}
//               data-cy="show-annotations"
//             />
//             {t('showAnnotations')}
//           </label>
//         </div>
//       </div>

//       <div
//         style={{
//           height: viewportElementDimensions.height,
//           width: viewportElementDimensions.width,
//           position: 'absolute',
//           left: '9999px',
//         }}
//         ref={ref => setViewportElement(ref)}
//       >
//         <canvas
//           className={canvasClass}
//           style={{
//             height: downloadCanvas.height,
//             width: downloadCanvas.width,
//             display: 'block',
//           }}
//           width={downloadCanvas.width}
//           height={downloadCanvas.height}
//           ref={downloadCanvas.ref}
//         />
//       </div>

//       {viewportPreview.src ? (
//         <div className="preview" data-cy="image-preview">
//           <div className="preview-header">{t('imagePreview')}</div>
//           <img
//             className="viewport-preview"
//             src={viewportPreview.src}
//             alt={t('imagePreview')}
//             data-cy="viewport-preview-img"
//           />
//         </div>
//       ) : (
//         <div className="loading-image">
//           <Icon name="circle-notch" className="icon-spin" />
//           {t('loadingPreview')}
//         </div>
//       )}

//       <div className="actions">
//         <button
//           type="button"
//           className="btn btn-danger"
//           onClick={onClose}
//           data-cy="cancel-btn"
//         >
//           {t('Buttons:Cancel')}
//         </button>
//         <button
//           className="btn btn-primary"
//           onClick={downloadImage}
//           disabled={hasError}
//           data-cy="download-btn"
//         >
//           {t('Buttons:Download')}
//         </button>
//       </div>
//     </div>
//   );
// };

// ViewportDownloadForm.propTypes = {
//   onClose: PropTypes.func.isRequired,
//   activeViewport: PropTypes.object,
//   updateViewportPreview: PropTypes.func.isRequired,
//   enableViewport: PropTypes.func.isRequired,
//   disableViewport: PropTypes.func.isRequired,
//   toggleAnnotations: PropTypes.func.isRequired,
//   loadImage: PropTypes.func.isRequired,
//   downloadBlob: PropTypes.func.isRequired,
//   defaultSize: PropTypes.number.isRequired,
//   minimumSize: PropTypes.number.isRequired,
//   maximumSize: PropTypes.number.isRequired,
//   canvasClass: PropTypes.string.isRequired,
//   activeViewportIndex: PropTypes.number, // Add this prop
// };

// export default ViewportDownloadForm;

// import React, {
//   useRef,
//   useCallback,
//   useEffect,
//   useState,
//   createRef,
// } from 'react';
// import PropTypes from 'prop-types';
// import { useTranslation } from 'react-i18next';
// import './ViewportDownloadForm.styl';
// import { TextInput, Select, Icon } from '@ohif/ui';
// import classnames from 'classnames';
// import jsPDF from 'jspdf';
// import OHIF from '@ohif/core';

// const DEFAULT_FILENAME = 'image';
// const REFRESH_VIEWPORT_TIMEOUT = 1000;

// const ViewportDownloadForm = ({
//   activeViewport,
//   onClose,
//   updateViewportPreview,
//   enableViewport,
//   disableViewport,
//   toggleAnnotations,
//   loadImage,
//   downloadBlob,
//   defaultSize,
//   minimumSize,
//   maximumSize,
//   canvasClass,
//   activeViewportIndex,
// }) => {
//   const [t] = useTranslation('ViewportDownloadForm');

//   const [filename, setFilename] = useState(DEFAULT_FILENAME);
//   const [dimensions, setDimensions] = useState({
//     width: defaultSize,
//     height: defaultSize,
//   });
//   const [showAnnotations, setShowAnnotations] = useState(true);
//   const [viewportElement, setViewportElement] = useState();
//   const [viewportElementDimensions, setViewportElementDimensions] = useState({
//     width: defaultSize,
//     height: defaultSize,
//   });
//   const [downloadCanvas, setDownloadCanvas] = useState({
//     ref: createRef(),
//     width: defaultSize,
//     height: defaultSize,
//   });
//   const [isProcessing, setIsProcessing] = useState(false);

//   const refreshViewport = useRef(null);

//   // Helper function to get patient information
//   const getPatientInfo = () => {
//     try {
//       const { studyMetadataManager } = OHIF.utils;

//       // Get the current viewport data from Redux store
//       const state = window.store.getState();
//       const viewports = state.viewports;

//       if (!viewports || !viewports.viewportSpecificData) {
//         console.warn('No viewport data available');
//         return { patientName: 'Unknown', patientId: 'Unknown' };
//       }

//       // Use activeViewportIndex or fallback to 0
//       const viewportIndex =
//         activeViewportIndex !== undefined ? activeViewportIndex : 0;
//       const viewportData = viewports.viewportSpecificData[viewportIndex];

//       if (!viewportData || !viewportData.StudyInstanceUID) {
//         console.warn('No StudyInstanceUID found in viewport data');
//         return { patientName: 'Unknown', patientId: 'Unknown' };
//       }

//       // Get study metadata
//       const study = studyMetadataManager.get(viewportData.StudyInstanceUID);

//       if (!study || !study._data) {
//         console.warn('No study metadata found');
//         return { patientName: 'Unknown', patientId: 'Unknown' };
//       }

//       return {
//         patientName: study._data.PatientName || 'Unknown',
//         patientId: study._data.PatientID || 'Unknown',
//       };
//     } catch (error) {
//       console.error('Error getting patient info:', error);
//       return { patientName: 'Unknown', patientId: 'Unknown' };
//     }
//   };

//   const generatePDF = (canvas, filename) => {
//     const imgData = canvas.toDataURL('image/jpeg', 1.0);
//     const pdf = new jsPDF({ orientation: 'landscape' });
//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();

//     // Get patient information using the corrected approach
//     const { patientName, patientId } = getPatientInfo();

//     // Add patient info at the top
//     pdf.text(`Patient Name: ${patientName}`, 10, 10);
//     pdf.text(`Patient ID: ${patientId}`, 10, 18);

//     // Calculate available space for image (leaving margins and space for patient info)
//     const availableWidth = pageWidth - 20; // 10px margin on each side
//     const availableHeight = pageHeight - 40; // 25px from top for patient info + 15px bottom margin
//     const imageStartY = 25; // Start image below patient info

//     // Get canvas dimensions
//     const canvasWidth = canvas.width;
//     const canvasHeight = canvas.height;
//     const canvasAspectRatio = canvasWidth / canvasHeight;

//     // Calculate image dimensions while maintaining aspect ratio
//     let imageWidth, imageHeight;

//     if (canvasAspectRatio > availableWidth / availableHeight) {
//       // Image is wider relative to available space - fit to width
//       imageWidth = availableWidth;
//       imageHeight = availableWidth / canvasAspectRatio;
//     } else {
//       // Image is taller relative to available space - fit to height
//       imageHeight = availableHeight;
//       imageWidth = availableHeight * canvasAspectRatio;
//     }

//     // Center the image horizontally
//     const imageX = (pageWidth - imageWidth) / 2;

//     // Add the image with calculated dimensions
//     pdf.addImage(imgData, 'JPEG', imageX, imageStartY, imageWidth, imageHeight);
//     pdf.save(`${filename || DEFAULT_FILENAME}.pdf`);
//   };

//   const downloadPDF = async () => {
//     try {
//       console.log('Starting PDF download...');
//       setIsProcessing(true);

//       if (!viewportElement) {
//         console.warn('Viewport element not ready');
//         return;
//       }

//       await loadAndUpdateViewports();

//       const canvas = downloadCanvas.ref.current;
//       if (!canvas) {
//         console.warn('Canvas not ready');
//         return;
//       }

//       console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

//       generatePDF(canvas, filename);

//       console.log('PDF generated successfully');

//       // Close the component after download
//       if (onClose) {
//         setTimeout(() => {
//           onClose();
//         }, 500); // Reduced timeout for faster close
//       }
//     } catch (error) {
//       console.error('Error downloading PDF:', error);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const validSize = value => (value >= minimumSize ? value : minimumSize);

//   const loadAndUpdateViewports = useCallback(async () => {
//     try {
//       console.log('Loading and updating viewports...');

//       const { width, height } = await loadImage(
//         activeViewport,
//         viewportElement,
//         dimensions.width,
//         dimensions.height
//       );

//       console.log('Image loaded with dimensions:', width, 'x', height);

//       toggleAnnotations(showAnnotations, viewportElement);

//       const scaled = {
//         height: validSize(height),
//         width: validSize(width),
//       };

//       setViewportElementDimensions(scaled);
//       setDownloadCanvas(state => ({ ...state, ...scaled }));

//       // Wait for canvas to be updated
//       await new Promise(resolve => setTimeout(resolve, 100));

//       const {
//         dataUrl,
//         width: vpWidth,
//         height: vpHeight,
//       } = await updateViewportPreview(
//         viewportElement,
//         downloadCanvas.ref.current,
//         'pdf'
//       );

//       console.log('Viewport preview updated');
//     } catch (error) {
//       console.error('Error in loadAndUpdateViewports:', error);
//     }
//   }, [
//     activeViewport,
//     viewportElement,
//     showAnnotations,
//     loadImage,
//     toggleAnnotations,
//     updateViewportPreview,
//   ]);

//   useEffect(() => {
//     enableViewport(viewportElement);
//     return () => disableViewport(viewportElement);
//   }, [viewportElement, enableViewport, disableViewport]);

//   useEffect(() => {
//     if (refreshViewport.current !== null) {
//       clearTimeout(refreshViewport.current);
//     }
//     refreshViewport.current = setTimeout(() => {
//       refreshViewport.current = null;
//       loadAndUpdateViewports();
//     }, REFRESH_VIEWPORT_TIMEOUT);
//   }, [dimensions, showAnnotations, viewportElement]);

//   // Auto-download PDF when component mounts and canvas is ready
//   useEffect(() => {
//     if (viewportElement && downloadCanvas.ref.current && !isProcessing) {
//       // Add a small delay to ensure everything is properly initialized
//       setTimeout(() => {
//         downloadPDF();
//       }, 300); // Reduced delay for faster response
//     }
//   }, [viewportElement, downloadCanvas.ref.current]);

//   // Return null to prevent any UI from showing, but create hidden elements using useEffect
//   useEffect(() => {
//     // Create hidden DOM elements for processing
//     const hiddenContainer = document.createElement('div');
//     hiddenContainer.style.position = 'absolute';
//     hiddenContainer.style.left = '-9999px';
//     hiddenContainer.style.width = `${viewportElementDimensions.width}px`;
//     hiddenContainer.style.height = `${viewportElementDimensions.height}px`;

//     const hiddenCanvas = document.createElement('canvas');
//     hiddenCanvas.className = canvasClass;
//     hiddenCanvas.width = downloadCanvas.width;
//     hiddenCanvas.height = downloadCanvas.height;
//     hiddenCanvas.style.display = 'block';
//     hiddenCanvas.style.width = `${downloadCanvas.width}px`;
//     hiddenCanvas.style.height = `${downloadCanvas.height}px`;

//     hiddenContainer.appendChild(hiddenCanvas);
//     document.body.appendChild(hiddenContainer);

//     // Update refs
//     downloadCanvas.ref.current = hiddenCanvas;
//     setViewportElement(hiddenContainer);

//     // Cleanup function
//     return () => {
//       if (document.body.contains(hiddenContainer)) {
//         document.body.removeChild(hiddenContainer);
//       }
//     };
//   }, []);

//   // Return null to prevent any UI from rendering
//   return null;
// };

// ViewportDownloadForm.propTypes = {
//   onClose: PropTypes.func.isRequired,
//   activeViewport: PropTypes.object,
//   updateViewportPreview: PropTypes.func.isRequired,
//   enableViewport: PropTypes.func.isRequired,
//   disableViewport: PropTypes.func.isRequired,
//   toggleAnnotations: PropTypes.func.isRequired,
//   loadImage: PropTypes.func.isRequired,
//   downloadBlob: PropTypes.func.isRequired,
//   defaultSize: PropTypes.number.isRequired,
//   minimumSize: PropTypes.number.isRequired,
//   maximumSize: PropTypes.number.isRequired,
//   canvasClass: PropTypes.string.isRequired,
//   activeViewportIndex: PropTypes.number,
// };

// export default ViewportDownloadForm;

import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  createRef,
} from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './ViewportDownloadForm.styl';
import { TextInput, Select, Icon } from '@ohif/ui';
import classnames from 'classnames';
import jsPDF from 'jspdf';
import OHIF from '@ohif/core';

const DEFAULT_FILENAME = 'image';
const REFRESH_VIEWPORT_TIMEOUT = 1000;

const ViewportDownloadForm = ({
  activeViewport,
  onClose,
  updateViewportPreview,
  enableViewport,
  disableViewport,
  toggleAnnotations,
  loadImage,
  downloadBlob,
  defaultSize,
  minimumSize,
  maximumSize,
  canvasClass,
  activeViewportIndex,
}) => {
  const [t] = useTranslation('ViewportDownloadForm');

  const [filename, setFilename] = useState(DEFAULT_FILENAME);
  const [dimensions, setDimensions] = useState({
    width: defaultSize,
    height: defaultSize,
  });
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [viewportElement, setViewportElement] = useState();
  const [viewportElementDimensions, setViewportElementDimensions] = useState({
    width: defaultSize,
    height: defaultSize,
  });
  const [downloadCanvas, setDownloadCanvas] = useState({
    ref: createRef(),
    width: defaultSize,
    height: defaultSize,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('Initializing...');
  const [downloadComplete, setDownloadComplete] = useState(false);

  const refreshViewport = useRef(null);

  // Helper function to get patient information
  const getPatientInfo = () => {
    try {
      const { studyMetadataManager } = OHIF.utils;

      // Get the current viewport data from Redux store
      const state = window.store.getState();
      const viewports = state.viewports;

      if (!viewports || !viewports.viewportSpecificData) {
        console.warn('No viewport data available');
        return { patientName: 'Unknown', patientId: 'Unknown' };
      }

      // Use activeViewportIndex or fallback to 0
      const viewportIndex =
        activeViewportIndex !== undefined ? activeViewportIndex : 0;
      const viewportData = viewports.viewportSpecificData[viewportIndex];

      if (!viewportData || !viewportData.StudyInstanceUID) {
        console.warn('No StudyInstanceUID found in viewport data');
        return { patientName: 'Unknown', patientId: 'Unknown' };
      }

      // Get study metadata
      const study = studyMetadataManager.get(viewportData.StudyInstanceUID);

      if (!study || !study._data) {
        console.warn('No study metadata found');
        return { patientName: 'Unknown', patientId: 'Unknown' };
      }

      return {
        patientName: study._data.PatientName || 'Unknown',
        patientId: study._data.PatientID || 'Unknown',
      };
    } catch (error) {
      console.error('Error getting patient info:', error);
      return { patientName: 'Unknown', patientId: 'Unknown' };
    }
  };

  const generatePDF = (canvas, filename) => {
    setDownloadStatus('Generating PDF...');

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({ orientation: 'landscape' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Get patient information using the corrected approach
    const { patientName, patientId } = getPatientInfo();

    // Add patient info - Patient ID on left, Patient Name on right
    pdf.text(`Patient ID: ${patientId}`, 10, 10);
    pdf.text(`Patient Name: ${patientName}`, pageWidth - 10, 10, {
      align: 'right',
    });

    // Calculate available space for image (leaving margins and space for patient info)
    const availableWidth = pageWidth - 20; // 10px margin on each side
    const availableHeight = pageHeight - 40; // 25px from top for patient info + 15px bottom margin
    const imageStartY = 25; // Start image below patient info

    // Get canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;

    // Calculate image dimensions while maintaining aspect ratio
    let imageWidth, imageHeight;

    if (canvasAspectRatio > availableWidth / availableHeight) {
      // Image is wider relative to available space - fit to width
      imageWidth = availableWidth;
      imageHeight = availableWidth / canvasAspectRatio;
    } else {
      // Image is taller relative to available space - fit to height
      imageHeight = availableHeight;
      imageWidth = availableHeight * canvasAspectRatio;
    }

    // Center the image horizontally
    const imageX = (pageWidth - imageWidth) / 2;

    // Add the image with calculated dimensions
    pdf.addImage(imgData, 'JPEG', imageX, imageStartY, imageWidth, imageHeight);

    setDownloadStatus('Saving PDF...');
    pdf.save(`${filename || DEFAULT_FILENAME}.pdf`);

    setDownloadStatus('Download Complete!');
    setDownloadComplete(true);
  };

  const downloadPDF = async () => {
    try {
      console.log('Starting PDF download...');
      setIsProcessing(true);
      setDownloadStatus('Preparing download...');

      if (!viewportElement) {
        console.warn('Viewport element not ready');
        return;
      }

      setDownloadStatus('Loading image...');
      await loadAndUpdateViewports();

      const canvas = downloadCanvas.ref.current;
      if (!canvas) {
        console.warn('Canvas not ready');
        return;
      }

      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

      generatePDF(canvas, filename);

      console.log('PDF generated successfully');

      // Close the component after download
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 2000); // Give user time to see completion message
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setDownloadStatus('Error occurred during download');
    } finally {
      setIsProcessing(false);
    }
  };

  const validSize = value => (value >= minimumSize ? value : minimumSize);

  const loadAndUpdateViewports = useCallback(async () => {
    try {
      console.log('Loading and updating viewports...');
      setDownloadStatus('Processing viewport...');

      const { width, height } = await loadImage(
        activeViewport,
        viewportElement,
        dimensions.width,
        dimensions.height
      );

      console.log('Image loaded with dimensions:', width, 'x', height);

      toggleAnnotations(showAnnotations, viewportElement);

      const scaled = {
        height: validSize(height),
        width: validSize(width),
      };

      setViewportElementDimensions(scaled);
      setDownloadCanvas(state => ({ ...state, ...scaled }));

      // Wait for canvas to be updated
      await new Promise(resolve => setTimeout(resolve, 100));

      setDownloadStatus('Updating preview...');
      const {
        dataUrl,
        width: vpWidth,
        height: vpHeight,
      } = await updateViewportPreview(
        viewportElement,
        downloadCanvas.ref.current,
        'pdf'
      );

      console.log('Viewport preview updated');
    } catch (error) {
      console.error('Error in loadAndUpdateViewports:', error);
      setDownloadStatus('Error processing viewport');
    }
  }, [
    activeViewport,
    viewportElement,
    showAnnotations,
    loadImage,
    toggleAnnotations,
    updateViewportPreview,
  ]);

  useEffect(() => {
    enableViewport(viewportElement);
    return () => disableViewport(viewportElement);
  }, [viewportElement, enableViewport, disableViewport]);

  useEffect(() => {
    if (refreshViewport.current !== null) {
      clearTimeout(refreshViewport.current);
    }
    refreshViewport.current = setTimeout(() => {
      refreshViewport.current = null;
      loadAndUpdateViewports();
    }, REFRESH_VIEWPORT_TIMEOUT);
  }, [dimensions, showAnnotations, viewportElement]);

  // Auto-download PDF when component mounts and canvas is ready
  useEffect(() => {
    if (viewportElement && downloadCanvas.ref.current && !isProcessing) {
      // Add a small delay to ensure everything is properly initialized
      setTimeout(() => {
        downloadPDF();
      }, 300);
    }
  }, [viewportElement, downloadCanvas.ref.current]);

  // Create hidden DOM elements for processing
  useEffect(() => {
    const hiddenContainer = document.createElement('div');
    hiddenContainer.style.position = 'absolute';
    hiddenContainer.style.left = '-9999px';
    hiddenContainer.style.width = `${viewportElementDimensions.width}px`;
    hiddenContainer.style.height = `${viewportElementDimensions.height}px`;

    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.className = canvasClass;
    hiddenCanvas.width = downloadCanvas.width;
    hiddenCanvas.height = downloadCanvas.height;
    hiddenCanvas.style.display = 'block';
    hiddenCanvas.style.width = `${downloadCanvas.width}px`;
    hiddenCanvas.style.height = `${downloadCanvas.height}px`;

    hiddenContainer.appendChild(hiddenCanvas);
    document.body.appendChild(hiddenContainer);

    // Update refs
    downloadCanvas.ref.current = hiddenCanvas;
    setViewportElement(hiddenContainer);

    // Cleanup function
    return () => {
      if (document.body.contains(hiddenContainer)) {
        document.body.removeChild(hiddenContainer);
      }
    };
  }, []);

  // Render the download progress popup
  return (
    <div className="viewport-download-overlay">
      <div className="viewport-download-popup">
        <div className="popup-header">
          <h3>Download High Quality Image</h3>
          <button
            className="close-button"
            onClick={onClose}
            disabled={isProcessing}
          >
            ×
          </button>
        </div>
        <div className="popup-content">
          <div className="download-progress">
            {!downloadComplete ? (
              <>
                <div className="spinner"></div>
                <p className="status-text">{downloadStatus}</p>
              </>
            ) : (
              <>
                <div className="success-icon">✓</div>
                <p className="status-text">{downloadStatus}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ViewportDownloadForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  activeViewport: PropTypes.object,
  updateViewportPreview: PropTypes.func.isRequired,
  enableViewport: PropTypes.func.isRequired,
  disableViewport: PropTypes.func.isRequired,
  toggleAnnotations: PropTypes.func.isRequired,
  loadImage: PropTypes.func.isRequired,
  downloadBlob: PropTypes.func.isRequired,
  defaultSize: PropTypes.number.isRequired,
  minimumSize: PropTypes.number.isRequired,
  maximumSize: PropTypes.number.isRequired,
  canvasClass: PropTypes.string.isRequired,
  activeViewportIndex: PropTypes.number,
};

export default ViewportDownloadForm;
