'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Quote, Flame, Target, Repeat, Trophy } from 'lucide-react';
import styles from './page.module.css';

export default function ArenaPage() {
    return (
        <div className={styles.container}>
            <Link href="/" className={styles.backLink}>
                <ArrowLeft size={20} />
                Back to Home
            </Link>

            <header className={styles.header}>
                <div className={styles.headerIcon}>
                    <Trophy size={48} />
                </div>
                <h1 className={styles.title}>The Arena</h1>
                <p className={styles.subtitle}>The Philosophy That Drives Everything We Build</p>
            </header>

            {/* The Quote */}
            <section className={styles.quoteSection}>
                <Quote size={40} className={styles.quoteIcon} />
                <blockquote className={styles.quote}>
                    <p>
                        "It is not the critic who counts; not the man who points out how the strong man stumbles,
                        or where the doer of deeds could have done them better. The credit belongs to the man who
                        is actually in the arena, whose face is marred by dust and sweat and blood; who strives
                        valiantly; who errs, who comes short again and again, because there is no effort without
                        error and shortcoming; but who does actually strive to do the deeds; who knows great
                        enthusiasms, the great devotions; who spends himself in a worthy cause; who at the best
                        knows in the end the triumph of high achievement, and who at the worst, if he fails,
                        at least fails while daring greatly, so that his place shall never be with those cold
                        and timid souls who neither know victory nor defeat."
                    </p>
                    <footer>— Theodore Roosevelt, 1910</footer>
                </blockquote>
            </section>

            {/* Philosophy Sections */}
            <div className={styles.philosophyGrid}>
                {/* On Failure */}
                <section className={styles.philosophyCard}>
                    <div className={styles.cardIcon}>
                        <Flame size={32} />
                    </div>
                    <h2>On Failure</h2>
                    <p>
                        We do not fear failure. We classify it.
                    </p>
                    <p>
                        There are two types of failure in this arena. The first is <strong>Execution Failure</strong>—you
                        tried, you reached out, you put yourself in front of the market, and you were rejected. This failure
                        is <em>rewarded</em>. It earns you Arena Points because it proves you dared greatly.
                    </p>
                    <p>
                        The second is <strong>Avoidance Failure</strong>—you had the opportunity but chose not to act.
                        You stayed in your comfort zone. You planned instead of executed. This failure receives no reward
                        because there was no courage.
                    </p>
                    <div className={styles.principle}>
                        <strong>Principle:</strong> Fail forward or don't fail at all. There is no participation trophy for watching from the stands.
                    </div>
                </section>

                {/* On Action */}
                <section className={styles.philosophyCard}>
                    <div className={styles.cardIcon}>
                        <Target size={32} />
                    </div>
                    <h2>On Action</h2>
                    <p>
                        Ideas are worthless. Execution is everything.
                    </p>
                    <p>
                        We do not measure how much you learned. We do not count the courses you completed. We do not
                        care how many books you read or how many plans you made. We measure one thing: <strong>what
                            did you do today that moved you closer to income?</strong>
                    </p>
                    <p>
                        Action is the only currency that compounds. Every outreach, every pitch, every rejection
                        brings you closer to the one "yes" that changes everything. The person who contacts 100
                        potential clients will always outperform the person who perfects their portfolio in isolation.
                    </p>
                    <div className={styles.principle}>
                        <strong>Principle:</strong> Done is better than perfect. Shipped is better than planned. Real is better than imagined.
                    </div>
                </section>

                {/* On Habit */}
                <section className={styles.philosophyCard}>
                    <div className={styles.cardIcon}>
                        <Repeat size={32} />
                    </div>
                    <h2>On Habit</h2>
                    <p>
                        Motivation fades. Systems endure.
                    </p>
                    <p>
                        We do not rely on you "feeling like it." We build systems that make action unavoidable.
                        Your <strong>Momentum</strong> score decays when you disappear—not as punishment, but as physics.
                        Objects at rest stay at rest. Objects in motion stay in motion.
                    </p>
                    <p>
                        The goal is not to be exceptional once. It is to be consistent always. Small actions,
                        repeated daily, compound into extraordinary outcomes. The person who shows up every day
                        for 90 days will always beat the person who shows up intensely for 9 days.
                    </p>
                    <div className={styles.principle}>
                        <strong>Principle:</strong> You don't rise to your goals. You fall to the level of your systems.
                    </div>
                </section>

                {/* On Greatness */}
                <section className={styles.philosophyCard}>
                    <div className={styles.cardIcon}>
                        <Trophy size={32} />
                    </div>
                    <h2>On Greatness</h2>
                    <p>
                        Greatness is not reserved for the talented. It belongs to the relentless.
                    </p>
                    <p>
                        You are not here because you are special. You are here because you are willing. Willing to
                        be uncomfortable. Willing to be rejected. Willing to look foolish in the pursuit of something
                        meaningful. That willingness is rarer than talent.
                    </p>
                    <p>
                        The only people who fail in this arena are those who refuse to enter it. If you step in,
                        if you try, if you dare—you have already separated yourself from the millions who only
                        dream. Victory is not guaranteed. But the arena itself is the reward.
                    </p>
                    <div className={styles.principle}>
                        <strong>Principle:</strong> The question is not "Am I good enough?" The question is "Am I willing to become good enough?"
                    </div>
                </section>
            </div>

            {/* System Laws */}
            <section className={styles.lawsSection}>
                <h2>The System Laws</h2>
                <p className={styles.lawsIntro}>
                    These principles are immutable. They are baked into every algorithm, every interface,
                    every decision we make.
                </p>
                <div className={styles.lawsGrid}>
                    <div className={styles.law}>
                        <span className={styles.lawNumber}>01</span>
                        <p>Poverty is not solved by motivation. It is solved by systems that make action unavoidable.</p>
                    </div>
                    <div className={styles.law}>
                        <span className={styles.lawNumber}>02</span>
                        <p>Income is the only credible proof of transformation.</p>
                    </div>
                    <div className={styles.law}>
                        <span className={styles.lawNumber}>03</span>
                        <p>Humans teach. Systems enforce.</p>
                    </div>
                    <div className={styles.law}>
                        <span className={styles.lawNumber}>04</span>
                        <p>Support follows effort. Never the reverse.</p>
                    </div>
                    <div className={styles.law}>
                        <span className={styles.lawNumber}>05</span>
                        <p>Failure while trying is progress. Failure to try is the only true failure.</p>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className={styles.ctaSection}>
                <h2>Enter The Arena</h2>
                <p>
                    Every day you have a choice. Stay in the stands with the critics and the comfortable.
                    Or step into the arena where the dust and sweat and blood await.
                </p>
                <p>
                    The arena is hard. But it is the only place where greatness is forged.
                </p>
                <p className={styles.finalWord}>
                    <strong>Welcome to the arena. Now get to work.</strong>
                </p>
            </section>

            {/* Signature */}
            <footer className={styles.signatureSection}>
                <Image
                    src="/sig.png"
                    alt="Signature"
                    width={200}
                    height={80}
                    className={styles.signature}
                />
                <p className={styles.signatureCaption}>Founder, Cycle 28</p>
            </footer>
        </div>
    );
}
