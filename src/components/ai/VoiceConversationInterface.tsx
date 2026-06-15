import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Camera, Upload, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceConversationInterfaceProps {
  context?: string;
  userId?: string;
  className?: string;
}

export const VoiceConversationInterface: React.FC<VoiceConversationInterfaceProps> = ({
  context,
  userId,
  className = ''
}) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [conversation, setConversation] = useState<any[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Enregistrement",
        description: "Parlez maintenant...",
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processAudioInput = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert audio to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      // First, transcribe the audio
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (transcriptionError) {
        throw transcriptionError;
      }

      const transcriptText = transcriptionData.text;
      setCurrentTranscript(transcriptText);

      // Add user message to conversation
      const userMessage = {
        role: 'user',
        content: transcriptText,
        timestamp: new Date(),
        type: 'voice'
      };
      
      setConversation(prev => [...prev, userMessage]);

      // Send to conversational AI
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('conversational-ai', {
        body: {
          message: transcriptText,
          context,
          userId,
          includeVoice: audioEnabled
        }
      });

      if (aiError) {
        throw aiError;
      }

      // Add AI response to conversation
      const aiMessage = {
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
        type: 'voice',
        audioContent: aiResponse.audioContent,
        toolResults: aiResponse.toolResults
      };
      
      setConversation(prev => [...prev, aiMessage]);

      // Play audio response if available
      if (aiResponse.audioContent && audioEnabled) {
        playAudioResponse(aiResponse.audioContent);
      }

      toast({
        title: "Réponse reçue",
        description: "L'assistant a traité votre demande",
      });

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentTranscript('');
    }
  };

  const playAudioResponse = (base64Audio: string) => {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Error playing audio response:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const base64Image = base64Data.split(',')[1];

        // Send to conversational AI with image
        const { data: aiResponse, error } = await supabase.functions.invoke('conversational-ai', {
          body: {
            message: null,
            imageData: base64Image,
            context,
            userId,
            includeVoice: audioEnabled
          }
        });

        if (error) {
          throw error;
        }

        // Add messages to conversation
        const userMessage = {
          role: 'user',
          content: '[Image uploadée]',
          timestamp: new Date(),
          type: 'image',
          imageData: base64Data
        };

        const aiMessage = {
          role: 'assistant',
          content: aiResponse.response,
          timestamp: new Date(),
          type: 'analysis',
          audioContent: aiResponse.audioContent,
          toolResults: aiResponse.toolResults
        };

        setConversation(prev => [...prev, userMessage, aiMessage]);

        // Play audio if available
        if (aiResponse.audioContent && audioEnabled) {
          playAudioResponse(aiResponse.audioContent);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'analyse d'image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Assistant Conversationnel IA
          <Badge variant="secondary" className="ml-auto">GPT-4o + ElevenLabs</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conversation Display */}
        <div className="h-64 border rounded-lg p-4 overflow-y-auto bg-muted/30">
          {conversation.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Appuyez sur le microphone pour commencer une conversation vocale</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {conversation.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      {message.type === 'image' && message.imageData && (
                        <img 
                          src={message.imageData} 
                          alt="Uploaded" 
                          className="max-w-32 rounded mb-2"
                        />
                      )}
                      <p className="text-sm">{message.content}</p>
                      
                      {message.toolResults && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                          <strong>Actions IA:</strong> {message.toolResults.length} fonction(s) exécutée(s)
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 mt-1 opacity-70">
                        {message.type === 'voice' && <Mic className="h-3 w-3" />}
                        {message.type === 'image' && <Camera className="h-3 w-3" />}
                        <span className="text-xs">{formatTime(message.timestamp)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Current Transcript Display */}
          {currentTranscript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded border-l-4 border-yellow-400"
            >
              <p className="text-sm font-medium">Transcription:</p>
              <p className="text-sm">{currentTranscript}</p>
            </motion.div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              Traitement en cours...
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Voice Recording Button */}
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className="flex-1"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isRecording ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Arrêter l'enregistrement
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Parler à l'assistant
              </>
            )}
          </Button>

          {/* Audio Toggle */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

          {/* Image Upload */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Status Indicators */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={isRecording ? "destructive" : "secondary"}>
            {isRecording ? "Enregistrement..." : "Prêt"}
          </Badge>
          <Badge variant={audioEnabled ? "default" : "secondary"}>
            Audio: {audioEnabled ? "Activé" : "Désactivé"}
          </Badge>
          <Badge variant="outline">
            GPT-4o Vision + ElevenLabs Turbo
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};