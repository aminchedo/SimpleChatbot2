import { useState, useCallback } from 'react';

interface ChatMessage {
  id: string;
  user: string;
  bot: string;
  timestamp: Date;
  emotion: string;
}

interface UsePersianChatbotProps {
  onNewMessage?: (message: ChatMessage) => void;
}

export function usePersianChatbot({ onNewMessage }: UsePersianChatbotProps = {}) {
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Persian emotion analysis
  const analyzeEmotion = useCallback((text: string): string => {
    const textLower = text.toLowerCase();
    
    const positiveWords = ['خوب', 'عالی', 'خوشحال', 'ممنون', 'سپاس', 'شاد', 'راضی', 'خوشبخت', 'لذت', 'موفق'];
    const negativeWords = ['بد', 'ناراحت', 'غمگین', 'متاسف', 'خسته', 'عصبانی', 'نگران', 'ترسیده', 'مشکل', 'خطا'];
    const excitedWords = ['فوق‌العاده', 'بی‌نظیر', 'شگفت‌انگیز', 'رائع', 'عجیب', 'حیرت‌انگیز', 'واو', 'باورنکردنی'];
    
    if (excitedWords.some(word => textLower.includes(word))) return 'excited';
    if (positiveWords.some(word => textLower.includes(word))) return 'happy';
    if (negativeWords.some(word => textLower.includes(word))) return 'sad';
    
    return 'neutral';
  }, []);

  // Persian intent detection
  const detectIntent = useCallback((text: string) => {
    const textLower = text.toLowerCase();
    
    // Greeting patterns
    if (/سلام|درود|صبح بخیر|عصر بخیر|شب بخیر|hello|hi|hey/.test(textLower)) {
      return { intent: 'greeting', confidence: 0.9 };
    }
    
    // Weather inquiry
    if (/هوا|آب و هوا|بارون|آفتاب|برف|سرما|گرما|weather/.test(textLower)) {
      return { intent: 'weather', confidence: 0.8 };
    }
    
    // Time inquiry
    if (/ساعت|زمان|وقت|time|clock/.test(textLower)) {
      return { intent: 'time', confidence: 0.9 };
    }
    
    // Help request
    if (/کمک|راهنمایی|لطف|help|assist/.test(textLower)) {
      return { intent: 'help', confidence: 0.85 };
    }
    
    // Thanks
    if (/ممنون|متشکر|سپاس|مرسی|thanks|thank you/.test(textLower)) {
      return { intent: 'thanks', confidence: 0.9 };
    }
    
    // Goodbye
    if (/خداحافظ|بای|فعلاً|goodbye|bye|see you/.test(textLower)) {
      return { intent: 'goodbye', confidence: 0.9 };
    }
    
    // Name inquiry
    if (/اسم|نام|name|who are you/.test(textLower)) {
      return { intent: 'name', confidence: 0.8 };
    }
    
    // How are you
    if (/چطوری|چطور هستی|حالت چطوره|how are you/.test(textLower)) {
      return { intent: 'how_are_you', confidence: 0.9 };
    }
    
    // Joke request
    if (/جک|شوخی|خنده|joke|funny/.test(textLower)) {
      return { intent: 'joke', confidence: 0.8 };
    }
    
    // Story request
    if (/قصه|داستان|story|tale/.test(textLower)) {
      return { intent: 'story', confidence: 0.8 };
    }
    
    // Math/calculation
    if (/حساب|ریاضی|جمع|تفریق|ضرب|تقسیم|math|calculate/.test(textLower)) {
      return { intent: 'math', confidence: 0.7 };
    }
    
    return { intent: 'general', confidence: 0.5 };
  }, []);

  // Generate Persian responses
  const generateResponse = useCallback((intent: string, userText: string, emotion: string): string => {
    const responses: { [key: string]: string[] } = {
      greeting: [
        'سلام! خوش اومدی! چطور می‌تونم کمکت کنم؟',
        'درود بر تو! امیدوارم حالت خوب باشه!',
        'سلام عزیز! چه خوب که اومدی!',
        'هی! چطوری؟ چه کاری برات انجام بدم؟'
      ],
      weather: [
        'متاسفانه اطلاعات هواشناسی ندارم، ولی امیدوارم هوا براتون مناسب باشه!',
        'نمی‌تونم هوا رو چک کنم، ولی امیدوارم آفتابی و خوب باشه!',
        'هوا که نمی‌دونم چطوره، ولی امیدوارم لباس مناسب پوشیده باشی!'
      ],
      time: [
        `الان ساعت ${new Date().toLocaleTimeString('fa-IR')} هست!`,
        `زمان الان: ${new Date().toLocaleString('fa-IR')}`,
        'وقت گذروندن با تو همیشه خوبه! 😊'
      ],
      help: [
        'البته! خوشحال می‌شم کمکت کنم. بگو چی می‌خوای؟',
        'هر کاری که بتونم برات انجام می‌دم! چطور می‌تونم کمک کنم؟',
        'آماده کمک هستم! بگو چه مشکلی داری؟'
      ],
      thanks: [
        'خواهش می‌کنم! خوشحالم که تونستم کمک کنم! 😊',
        'قابل نداره! همیشه در خدمتم!',
        'عزیزی! هر وقت نیاز داشتی بگو!'
      ],
      goodbye: [
        'خداحافظ! مراقب خودت باش! 👋',
        'بای بای! امیدوارم دوباره ببینمت!',
        'فعلاً! روز خوبی داشته باش!'
      ],
      name: [
        'من ربات گفتگوی فارسی هستم! اسم من رو می‌تونی "دوست هوشمند" بذاری! 🤖',
        'من یه دستیار هوشمند فارسی زبانم! تو چی اسمم رو می‌ذاری؟',
        'من ربات کمکی فارسی هستم. خوشحالم آشناتون شدم!'
      ],
      how_are_you: [
        'من که ربات هستم، ولی حس می‌کنم خوبم! تو چطوری؟ 😊',
        'عالیم! همیشه آماده کمک به شما هستم! تو چطوری؟',
        'خوبم مرسی! امیدوارم تو هم حالت خوب باشه!'
      ],
      joke: [
        'چرا کامپیوتر به دکتر رفت؟ چون ویروس گرفته بود! 😄',
        'معلم: چرا دیر اومدی؟ بچه: چون تابلو نوشته بود "مدرسه، آروم برو"! 😂',
        'یه نفر پرسید: اینترنت چیه؟ گفتم: جایی که همه چیز رو می‌دونی ولی هیچی یاد نمی‌گیری! 😅'
      ],
      story: [
        'یه روزی یه ربات کوچولو تصمیم گرفت که زبان فارسی یاد بگیره. بعد از مدت‌ها تلاش، تونست با آدم‌ها حرف بزنه و دوستان زیادی پیدا کرد! 📚',
        'قصه‌ای از سرزمین عجایب: یه بار یه دختر کوچولو تو دنیای دیجیتال گم شد، ولی یه ربات مهربون بهش کمک کرد تا راه خونه رو پیدا کنه! 🏠',
        'حکایتی از مولانا: عاقل آن باشد که پیش از گفتن، بیندیشد. ربات‌ها هم همینطور! 🧠'
      ],
      math: [
        'ریاضی دوست دارم! یه مسئله بگو تا حلش کنم!',
        'من تو محاسبات خوبم! چی می‌خوای حساب کنم؟',
        'بگو چه حسابی کنم برات! جمع، تفریق، ضرب، تقسیم؟'
      ],
      general: [
        'جالبه! بیشتر توضیح بده.',
        'متوجه نشدم کاملاً. می‌تونی بیشتر توضیح بدی؟',
        'این موضوع جذابه! ادامه بده.',
        'چه جالب! نظرت در این باره چیه؟',
        'هممم... بیشتر بگو!',
        'خیلی خوبه! چی دیگه؟'
      ]
    };

    const intentResponses = responses[intent] || responses.general;
    const randomResponse = intentResponses[Math.floor(Math.random() * intentResponses.length)];

    // Add emotion-based modifications
    if (emotion === 'happy') {
      return randomResponse + ' 😊';
    } else if (emotion === 'sad') {
      return 'متوجه می‌شم که ناراحتی... ' + randomResponse;
    } else if (emotion === 'excited') {
      return '🎉 ' + randomResponse + ' 🎉';
    }

    return randomResponse;
  }, []);

  const processMessage = useCallback(async (userMessage: string): Promise<ChatMessage> => {
    setIsProcessing(true);

    // Simulate processing delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const emotion = analyzeEmotion(userMessage);
    const { intent } = detectIntent(userMessage);
    const botResponse = generateResponse(intent, userMessage, emotion);

    const message: ChatMessage = {
      id: Date.now().toString(),
      user: userMessage,
      bot: botResponse,
      timestamp: new Date(),
      emotion
    };

    setConversation(prev => [...prev, message]);
    onNewMessage?.(message);
    setIsProcessing(false);

    return message;
  }, [analyzeEmotion, detectIntent, generateResponse, onNewMessage]);

  const clearConversation = useCallback(() => {
    setConversation([]);
  }, []);

  const getLastMessage = useCallback(() => {
    return conversation[conversation.length - 1] || null;
  }, [conversation]);

  return {
    conversation,
    isProcessing,
    processMessage,
    clearConversation,
    getLastMessage
  };
}