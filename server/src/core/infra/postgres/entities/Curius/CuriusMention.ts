import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { CuriusHighlight } from "./CuriusHighlight";
import { CuriusLink } from "./CuriusLink";
import { CuriusUser } from "./CuriusUser";

@Entity({ name: "curius_mentions" })
export class CuriusMention {
    @PrimaryColumn()
    id!: number;

    @Column()
    fromUid!: number;

    @Column()
    toUid!: number;

    @ManyToOne(() => CuriusLink, { lazy: true })
    @JoinColumn({ name: "link_id" })
    link!: Promise<CuriusLink>;

    @ManyToOne(() => CuriusUser)
    @JoinColumn({ name: "user_id" })
    user!: CuriusUser;

    @ManyToOne(() => CuriusHighlight, { nullable: true, lazy: true })
    @JoinColumn({ name: "highlight_id" })
    highlight?: Promise<CuriusHighlight>;

    @Column({ name: "created_date" })
    createdDate!: Date;
}
