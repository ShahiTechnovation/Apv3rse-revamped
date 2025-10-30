import type { Message } from 'ai';
import React, { type RefCallback, useCallback, useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { MODEL_LIST, PROVIDER_LIST, initializeModelList } from '~/utils/constants';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { APIKeyManager, getApiKeysFromCookies } from './APIKeyManager';
import Cookies from 'js-cookie';
import * as Tooltip from '@radix-ui/react-tooltip';

import styles from './BaseChat.module.scss';
import { ExportChatButton } from '~/components/chat/chatExportAndImport/ExportChatButton';
import { ImportButtons } from '~/components/chat/chatExportAndImport/ImportButtons';
import { ExamplePrompts } from '~/components/chat/ExamplePrompts';
import GitCloneButton from './GitCloneButton';

import FilePreview from './FilePreview';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import type { IProviderSetting, ProviderInfo } from '~/types/model';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { toast } from 'react-toastify';
import StarterTemplates from './StarterTemplates';
import type { ActionAlert } from '~/types/actions';
import ChatAlert from './ChatAlert';
import { LLMManager } from '~/lib/modules/llm/manager';
import { AgentStore } from './AgentStore';
import { useStore } from '@nanostores/react';
import { agentsStore, saveAgent, deleteAgent } from '~/lib/stores/agents';
import { enabledToolsStore, toggleTool } from '~/lib/stores/tools';
import { AVAILABLE_TOOLS } from '~/lib/tools/registry';

const TEXTAREA_MIN_HEIGHT = 76;

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  description?: string;
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  providerList?: ProviderInfo[];
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  exportChat?: () => void;
  uploadedFiles?: File[];
  setUploadedFiles?: (files: File[]) => void;
  imageDataList?: string[];
  setImageDataList?: (dataList: string[]) => void;
  actionAlert?: ActionAlert;
  clearAlert?: () => void;
}

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      model,
      setModel,
      provider,
      setProvider,
      providerList,
      input = '',
      enhancingPrompt,
      handleInputChange,

      // promptEnhanced,
      enhancePrompt,
      sendMessage,
      handleStop,
      importChat,
      exportChat,
      uploadedFiles = [],
      setUploadedFiles,
      imageDataList = [],
      setImageDataList,
      messages,
      actionAlert,
      clearAlert,
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [apiKeys, setApiKeys] = useState<Record<string, string>>(getApiKeysFromCookies());
    const [modelList, setModelList] = useState(MODEL_LIST);
    const [isModelSettingsCollapsed, setIsModelSettingsCollapsed] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [transcript, setTranscript] = useState('');
    const [isModelLoading, setIsModelLoading] = useState<string | undefined>('all');
    const [selectedSDK, setSelectedSDK] = useState('Vercel'); // State for selected SDK
    const [isAgentStoreOpen, setIsAgentStoreOpen] = useState(false);
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);
    const agents = useStore(agentsStore);
    const enabledTools = useStore(enabledToolsStore);

    const getProviderSettings = useCallback(() => {
      let providerSettings: Record<string, IProviderSetting> | undefined = undefined;

      try {
        const savedProviderSettings = Cookies.get('providers');

        if (savedProviderSettings) {
          const parsedProviderSettings = JSON.parse(savedProviderSettings);

          if (typeof parsedProviderSettings === 'object' && parsedProviderSettings !== null) {
            providerSettings = parsedProviderSettings;
          }
        }
      } catch (error) {
        console.error('Error loading Provider Settings from cookies:', error);

        // Clear invalid cookie data
        Cookies.remove('providers');
      }

      return providerSettings;
    }, []);
    useEffect(() => {
      console.log(transcript);
    }, [transcript]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (showToolsDropdown) {
          const target = event.target as HTMLElement;
          if (!target.closest('.tools-dropdown-container')) {
            setShowToolsDropdown(false);
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showToolsDropdown]);

    useEffect(() => {
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');

          setTranscript(transcript);

          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: transcript },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }, []);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        const providerSettings = getProviderSettings();
        let parsedApiKeys: Record<string, string> | undefined = {};

        try {
          parsedApiKeys = getApiKeysFromCookies();
          setApiKeys(parsedApiKeys);
        } catch (error) {
          console.error('Error loading API keys from cookies:', error);

          // Clear invalid cookie data
          Cookies.remove('apiKeys');
        }
        setIsModelLoading('all');
        initializeModelList({ apiKeys: parsedApiKeys, providerSettings })
          .then((modelList) => {
            setModelList(modelList);
          })
          .catch((error) => {
            console.error('Error initializing model list:', error);
          })
          .finally(() => {
            setIsModelLoading(undefined);
          });
      }
    }, [providerList, provider]);

    const onApiKeysChange = async (providerName: string, apiKey: string) => {
      const newApiKeys = { ...apiKeys, [providerName]: apiKey };
      setApiKeys(newApiKeys);
      Cookies.set('apiKeys', JSON.stringify(newApiKeys));

      const provider = LLMManager.getInstance(import.meta.env || process.env || {}).getProvider(providerName);

      if (provider && provider.getDynamicModels) {
        setIsModelLoading(providerName);

        try {
          const providerSettings = getProviderSettings();
          const staticModels = provider.staticModels;
          const dynamicModels = await provider.getDynamicModels(
            newApiKeys,
            providerSettings,
            import.meta.env || process.env || {},
          );

          setModelList((preModels) => {
            const filteredOutPreModels = preModels.filter((x) => x.provider !== providerName);
            return [...filteredOutPreModels, ...staticModels, ...dynamicModels];
          });
        } catch (error) {
          console.error('Error loading dynamic models:', error);
        }
        setIsModelLoading(undefined);
      }
    };

    const startListening = () => {
      if (recognition) {
        recognition.start();
        setIsListening(true);
      }
    };

    const stopListening = () => {
      if (recognition) {
        recognition.stop();
        setIsListening(false);
      }
    };

    const handleSendMessage = (event: React.UIEvent, messageInput?: string) => {
      if (sendMessage) {
        sendMessage(event, messageInput);

        if (recognition) {
          recognition.abort(); // Stop current recognition
          setTranscript(''); // Clear transcript
          setIsListening(false);

          // Clear the input by triggering handleInputChange with empty value
          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: '' },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        }
      }
    };

    const handleFileUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];

        if (file) {
          const reader = new FileReader();

          reader.onload = (e) => {
            const base64Image = e.target?.result as string;
            setUploadedFiles?.([...uploadedFiles, file]);
            setImageDataList?.([...imageDataList, base64Image]);
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;

      if (!items) {
        return;
      }

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();

          const file = item.getAsFile();

          if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
              const base64Image = e.target?.result as string;
              setUploadedFiles?.([...uploadedFiles, file]);
              setImageDataList?.([...imageDataList, base64Image]);
            };
            reader.readAsDataURL(file);
          }

          break;
        }
      }
    };

    const handleSaveAsAgent = () => {
      // Create a modal or prompt for name and description
      const name = prompt('Enter a name for this agent:');

      if (!name) {
        return;
      }

      const description = prompt('Enter a description for this agent:');

      if (!description) {
        return;
      }

      try {
        saveAgent(name, description, messages || [], []); // You might want to save more project-specific data
        toast.success('Agent saved successfully!');
      } catch (error) {
        console.error('Error saving agent:', error);
        toast.error('Failed to save agent');
      }
    };

    const handleAgentSelect = (agent: { name: string; messages: any[] }) => {
      if (importChat) {
        importChat(agent.name, agent.messages);
        setIsAgentStoreOpen(false);
      }
    };

    const handleAgentDelete = (agentId: string) => {
      if (confirm('Are you sure you want to delete this agent?')) {
        deleteAgent(agentId);
        toast.success('Agent deleted successfully!');
      }
    };

    const baseChat = (
      <div className="fixed inset-0 overflow-hidden">
        <div
          ref={ref}
          className={classNames(styles.BaseChat, 'relative flex h-full w-full')}
          data-chat-visible={showChat}
        >
          <ClientOnly>{() => <Menu />}</ClientOnly>

          <div ref={scrollRef} className="flex flex-col lg:flex-row w-full h-full">
            <div
              className={classNames(
                styles.Chat,
                'flex flex-col flex-grow lg:min-w-[var(--chat-min-width)] h-full overflow-y-auto',
              )}
            >
              {!chatStarted && (
                <div id="intro" className="mt-[16vh] max-w-chat mx-auto text-center px-4 lg:px-0">
                  <h1 className="text-3xl lg:text-6xl font-bold text-bolt-elements-textPrimary mb-4 animate-fade-in">
                    Lets Build on Aptos
                  </h1>

                  <p className="text-md lg:text-xl mb-8 text-bolt-elements-textSecondary animate-fade-in animation-delay-200">
                    Bring ideas onchain
                  </p>
                </div>
              )}
              <div
                className={classNames('pt-6 px-2 sm:px-6', {
                  'h-full flex flex-col': chatStarted,
                })}
              >
                <ClientOnly>
                  {() => {
                    return chatStarted ? (
                      <Messages
                        ref={messageRef}
                        className="flex flex-col w-full flex-1 max-w-chat pb-6 mx-auto z-1"
                        messages={messages}
                        isStreaming={isStreaming}
                      />
                    ) : null;
                  }}
                </ClientOnly>
                <div
                  className={classNames('flex flex-col gap-4 w-full max-w-chat mx-auto z-prompt mb-6', {
                    'sticky bottom-2': chatStarted,
                  })}
                >
                  <div className="bg-bolt-elements-background-depth-2">
                    {actionAlert && (
                      <ChatAlert
                        alert={actionAlert}
                        clearAlert={() => clearAlert?.()}
                        postMessage={(message) => {
                          sendMessage?.({} as any, message);
                          clearAlert?.();
                        }}
                      />
                    )}
                  </div>
                  <div
                    id="textarea12"
                    className={classNames(
                      'bg-bolt-elements-background-depth-2 p-3 rounded-lg border border-bolt-elements-borderColor relative w-full max-w-chat mx-auto z-prompt',
                    )}
                  >
                    <svg className={classNames(styles.PromptEffectContainer)}>
                      <defs>
                        <linearGradient
                          id="line-gradient"
                          x1="20%"
                          y1="0%"
                          x2="-14%"
                          y2="10%"
                          gradientUnits="userSpaceOnUse"
                          gradientTransform="rotate(-45)"
                        >
                          <stop offset="0%" stopColor="#b44aff" stopOpacity="0%"></stop>
                          <stop offset="40%" stopColor="#b44aff" stopOpacity="80%"></stop>
                          <stop offset="50%" stopColor="#b44aff" stopOpacity="80%"></stop>
                          <stop offset="100%" stopColor="#b44aff" stopOpacity="0%"></stop>
                        </linearGradient>
                        <linearGradient id="shine-gradient">
                          <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
                          <stop offset="40%" stopColor="#ffffff" stopOpacity="80%"></stop>
                          <stop offset="50%" stopColor="#ffffff" stopOpacity="80%"></stop>
                          <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
                        </linearGradient>
                      </defs>
                      <rect
                        className={classNames(styles.PromptEffectLine)}
                        pathLength="100"
                        strokeLinecap="round"
                      ></rect>
                      <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
                    </svg>
                    <div
                      className={classNames(
                        ' bg-[#f0f5f9] relative shadow-xs border border-bolt-elements-borderColor backdrop-blur rounded-lg',
                      )}
                    >
                      <textarea
                        ref={textareaRef}
                        className={classNames(
                          'w-full pl-4 pt-4 pr-16 outline-none resize-none text-black placeholder-gray-400 bg-transparent text-sm',
                          'transition-all duration-200',
                          'hover:border-bolt-elements-focus',
                        )}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.border = '2px solid #1488fc';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.border = '2px solid #1488fc';
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';

                          const files = Array.from(e.dataTransfer.files);
                          files.forEach((file) => {
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();

                              reader.onload = (e) => {
                                const base64Image = e.target?.result as string;
                                setUploadedFiles?.([...uploadedFiles, file]);
                                setImageDataList?.([...imageDataList, base64Image]);
                              };
                              reader.readAsDataURL(file);
                            }
                          });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            if (event.shiftKey) {
                              return;
                            }

                            event.preventDefault();

                            if (isStreaming) {
                              handleStop?.();
                              return;
                            }

                            // ignore if using input method engine
                            if (event.nativeEvent.isComposing) {
                              return;
                            }

                            handleSendMessage?.(event);
                          }
                        }}
                        value={input}
                        onChange={(event) => {
                          handleInputChange?.(event);
                        }}
                        onPaste={handlePaste}
                        style={{
                          minHeight: TEXTAREA_MIN_HEIGHT,
                          maxHeight: TEXTAREA_MAX_HEIGHT,
                        }}
                        placeholder="How can Apv3rse help you today?"
                        translate="no"
                      />

                      <div className="flex justify-between items-center text-sm p-4 pt-2">
                        <div className="flex gap-1 items-center">
                          <div>
                            <IconButton
                              title="Enhance prompt"
                              disabled={input.length === 0 || enhancingPrompt}
                              className={classNames(
                                'transition-all',
                                'bg-white', // White background
                                'rounded-md', // Rounded corners
                                'px-4 py-2', // Padding
                                'text-blue-900', // Blue text color (adjust if needed)
                                'font-bold', // Bold text
                                'shadow-md', // Subtle drop shadow
                                enhancingPrompt ? 'opacity-100' : '',
                              )}
                              onClick={() => {
                                enhancePrompt?.();
                                toast.success('Prompt enhanced!');
                              }}
                            >
                              <div className="i-bolt:stars text-l text-blue-500 mr-1" />
                              <span className=" text-l text-blue-500 mr-1">Enhance Prompt</span>
                            </IconButton>
                          </div>

                          <div
                            className={classNames(
                              'text-l text-blue-500 mr-1',
                              'transition-all',
                              'bg-white', // White background
                              'rounded-md', // Rounded corners
                              'p-1', // Padding (adjust as needed)
                              'hover:bg-gray-100', // Hover effect
                            )}
                          >
                            <SpeechRecognitionButton
                              isListening={isListening}
                              onStart={startListening}
                              onStop={stopListening}
                              disabled={isStreaming}
                            />
                          </div>
                        </div>

                        <ClientOnly>
                          {() => (
                            <SendButton
                              isStreaming={isStreaming}
                              disabled={!providerList || providerList.length === 0}
                              onClick={(event) => {
                                if (isStreaming) {
                                  handleStop?.();
                                  return;
                                }

                                if (input.length > 0 || uploadedFiles.length > 0) {
                                  handleSendMessage?.(event);
                                }
                              }}
                              className={styles.sendButton}
                            />
                          )}
                        </ClientOnly>

                        {/* Smaller text for "Use Shift + Return..." */}
                        {input.length > 3 && (
                          <div
                            className={classNames('text-xs text-bolt-elements-textTertiary', styles.shiftReturnText)}
                          >
                            Use{' '}
                            <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Shift</kbd> +{' '}
                            <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Return</kbd>{' '}
                            a new line
                          </div>
                        )}
                      </div>
                    </div>
                    <br></br>
                    <div className={classNames(isModelSettingsCollapsed ? 'hidden' : '')}>
                      <div
                        className={classNames(
                          'flex items-center justify-between w-full bg-white px-3 py-2 rounded-md',
                          isModelSettingsCollapsed ? 'hidden' : '',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-1 w-[130px] sm:w-auto">
                            <span className="text-xs text-gray-500">LLM</span>
                            <ModelSelector
                              key={provider?.name + ':' + modelList.length}
                              model={model}
                              setModel={setModel}
                              modelList={modelList}
                              provider={provider}
                              setProvider={setProvider}
                              providerList={providerList || (PROVIDER_LIST as ProviderInfo[])}
                              apiKeys={apiKeys}
                              modelLoading={isModelLoading}
                            />
                          </div>
                          <div className="flex flex-col gap-1 w-[130px] sm:w-auto">
                            <span className="text-xs text-gray-500">Framework</span>
                            <select
                              value={selectedSDK}
                              onChange={(e) => setSelectedSDK(e.target.value)}
                              className="px-3 py-2 rounded-md border-2 border-gray-500 text-xs w-full text-black"
                            >
                              <option value="Vercel">Vercel AI SDK Core</option>
                              {/* Add more options for other SDKs as needed */}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1 w-[90px] sm:w-auto relative tools-dropdown-container">
                            <span className="text-xs text-gray-500">Add Tools</span>
                            <button 
                              onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                              className="px-3 py-2 rounded-md border-2 border-gray-500 text-xs w-full text-black hover:bg-gray-100 transition-colors"
                            >
                              +
                            </button>
                            {showToolsDropdown && (
                              <div className="absolute top-full mt-1 z-50 bg-white border-2 border-gray-300 rounded-md shadow-lg min-w-[250px] max-h-[400px] overflow-y-auto">
                                <div className="p-2">
                                  <div className="text-xs font-semibold text-gray-700 mb-2 px-2">Available Tools</div>
                                  {AVAILABLE_TOOLS.map((tool) => {
                                    const isEnabled = enabledTools.includes(tool.id);
                                    const isAlwaysEnabled = tool.alwaysEnabled || tool.id === 'aptos';
                                    const isComingSoon = tool.comingSoon;
                                    
                                    return (
                                      <div
                                        key={tool.id}
                                        className={`flex items-center gap-2 p-2 rounded ${
                                          isComingSoon 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : isAlwaysEnabled 
                                            ? 'bg-green-50 cursor-default' 
                                            : 'hover:bg-gray-100 cursor-pointer'
                                        }`}
                                        onClick={() => {
                                          if (!isComingSoon && !isAlwaysEnabled) {
                                            toggleTool(tool.id);
                                          }
                                        }}
                                      >
                                        <div className="text-lg">{tool.icon}</div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <div className="text-xs font-medium text-black">{tool.name}</div>
                                            {isComingSoon && (
                                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">
                                                Coming Soon
                                              </span>
                                            )}
                                            {isAlwaysEnabled && !isComingSoon && (
                                              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                                Always On
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-600">{tool.description}</div>
                                        </div>
                                        {!isComingSoon && (
                                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                            isEnabled ? 'bg-green-500 border-green-500' : 'border-gray-400'
                                          }`}>
                                            {isEnabled && (
                                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                              </svg>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Removed the Templates section */}
                      </div>
                      <div className="mt-2">
                        {(providerList || []).length > 0 && provider && (
                          <APIKeyManager
                            provider={provider}
                            apiKey={apiKeys[provider.name] || ''}
                            setApiKey={(key) => {
                              onApiKeysChange(provider.name, key);
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <FilePreview
                        files={uploadedFiles}
                        imageDataList={imageDataList}
                        onRemove={(index) => {
                          setUploadedFiles?.(uploadedFiles.filter((_, i) => i !== index));
                          setImageDataList?.(imageDataList.filter((_, i) => i !== index));
                        }}
                      />
                    </div>

                    <ClientOnly>
                      {() => (
                        <ScreenshotStateManager
                          setUploadedFiles={setUploadedFiles}
                          setImageDataList={setImageDataList}
                          uploadedFiles={uploadedFiles}
                          imageDataList={imageDataList}
                        />
                      )}
                    </ClientOnly>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-5">
                {!chatStarted && (
                  <div className="flex justify-center gap-2">
                    {ImportButtons(importChat)}
                    <GitCloneButton importChat={importChat} />
                  </div>
                )}
                {!chatStarted &&
                  ExamplePrompts((event, messageInput) => {
                    if (isStreaming) {
                      handleStop?.();
                      return;
                    }

                    handleSendMessage?.(event, messageInput);
                  })}
                {!chatStarted && <StarterTemplates />}
              </div>
            </div>
            <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
          </div>
        </div>
      </div>
    );

    return (
      <Tooltip.Provider delayDuration={200}>
        {baseChat}
        <AgentStore
          isOpen={isAgentStoreOpen}
          onClose={() => setIsAgentStoreOpen(false)}
          agents={agents}
          onAgentSelect={handleAgentSelect}
          onAgentDelete={handleAgentDelete}
        />
      </Tooltip.Provider>
    );
  },
);

export default BaseChat;
