'use client';

import { useState } from 'react';
import { HelpCircle, MessageCircle, Mail, BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import styles from './page.module.css';

interface Faq {
    question: string;
    answer: string;
}

const faqs: Faq[] = [
    {
        question: 'How do I request support for a mission?',
        answer: 'Click the "Need Help?" button in the bottom right corner of your dashboard. Select the type of support you need (Data, Transport, Tools, or Speak to a Mentor), link it to your active mission, and describe what\'s blocking your progress.',
    },
    {
        question: 'How long does it take to get a response?',
        answer: 'Support requests are typically reviewed within 24-48 hours. You\'ll receive a notification once your request has been processed.',
    },
    {
        question: 'What counts towards my momentum score?',
        answer: 'Momentum increases when you complete daily actions, progress on missions, and maintain your streak. It decreases if you miss check-ins or go inactive for extended periods.',
    },
    {
        question: 'When am I eligible for support?',
        answer: 'Support eligibility depends on maintaining momentum above 50, completing missions consistently, and staying active in the program. Your dashboard shows your current eligibility status.',
    },
    {
        question: 'How do I change my skill track?',
        answer: 'Skill track changes are considered on a case-by-case basis. Reach out through the "Speak to a Mentor" option in the support request to discuss this.',
    },
    {
        question: 'What happens if I need to pause the program?',
        answer: 'If you need to pause due to personal circumstances, contact your mentor or use the support request. We understand life happens and can work with you on a plan.',
    },
];

export default function HelpPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Help Center</h1>
                <p>Find answers and get support</p>
            </header>

            {/* Quick Actions */}
            <section className={styles.quickActions}>
                <a href="#faq" className={styles.actionCard}>
                    <HelpCircle size={24} />
                    <div>
                        <h3>FAQs</h3>
                        <p>Common questions answered</p>
                    </div>
                </a>
                <div className={styles.actionCard} onClick={() => {
                    // Trigger the FAB programmatically
                    const fab = document.querySelector('[aria-label="Need Help?"]') as HTMLButtonElement;
                    fab?.click();
                }}>
                    <MessageCircle size={24} />
                    <div>
                        <h3>Request Support</h3>
                        <p>Get help with missions</p>
                    </div>
                </div>
                <a href="mailto:support@cycle28.com" className={styles.actionCard}>
                    <Mail size={24} />
                    <div>
                        <h3>Email Us</h3>
                        <p>support@cycle28.com</p>
                    </div>
                </a>
                <a href="/dashboard/resources" className={styles.actionCard}>
                    <BookOpen size={24} />
                    <div>
                        <h3>Resources</h3>
                        <p>Books & learning materials</p>
                    </div>
                </a>
            </section>

            {/* FAQs */}
            <section id="faq" className={styles.faqSection}>
                <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
                <div className={styles.faqList}>
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`${styles.faqItem} ${openFaq === index ? styles.open : ''}`}
                        >
                            <button
                                className={styles.faqQuestion}
                                onClick={() => toggleFaq(index)}
                            >
                                <span>{faq.question}</span>
                                {openFaq === index ? (
                                    <ChevronUp size={18} />
                                ) : (
                                    <ChevronDown size={18} />
                                )}
                            </button>
                            {openFaq === index && (
                                <div className={styles.faqAnswer}>
                                    <p>{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Still need help */}
            <section className={styles.stillNeedHelp}>
                <h3>Still need help?</h3>
                <p>Our team is here to support you on your journey.</p>
                <button
                    className={styles.contactBtn}
                    onClick={() => {
                        const fab = document.querySelector('[aria-label="Need Help?"]') as HTMLButtonElement;
                        fab?.click();
                    }}
                >
                    <MessageCircle size={18} />
                    Contact Support
                </button>
            </section>
        </div>
    );
}
