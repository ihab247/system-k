# system-k
 Automated Theorem Prover built using the implies and negation rules in System K of the Sequent Calculus

Example Proof
```
 ⇒ ((P → (¬(Q) → R)) → (¬((P → Q)) → (Q → R)))
----------------------------------------
(P → (¬(Q) → R)) ⇒ (¬((P → Q)) → (Q → R)) (⇒→)
        ----------------------------------------
        (P → (¬(Q) → R)), ¬((P → Q)) ⇒ (Q → R) (⇒→)
                ----------------------------------------
                (P → (¬(Q) → R)), ¬((P → Q)), Q ⇒ R (⇒→)
                        ----------------------------------------
                        ¬((P → Q)), Q ⇒ R,P (→⇒)
                                ----------------------------------------
                                Q ⇒ R,P,(P → Q) (¬⇒)
                                        ----------------------------------------
                                        Q, P ⇒ R,P,Q (⇒→)
                        (¬(Q) → R), ¬((P → Q)), Q ⇒ R (→⇒)
                                ----------------------------------------
                                ¬((P → Q)), Q ⇒ R,¬(Q) (→⇒)
                                        ----------------------------------------
                                        ¬((P → Q)), Q, Q ⇒ R (⇒¬)
                                                ----------------------------------------        
                                                Q, Q ⇒ R,(P → Q) (¬⇒)
                                                        ----------------------------------------
                                                        Q, Q, P ⇒ R,Q (⇒→)
                                R, ¬((P → Q)), Q ⇒ R (→⇒)
```

Todo
- create a parser
